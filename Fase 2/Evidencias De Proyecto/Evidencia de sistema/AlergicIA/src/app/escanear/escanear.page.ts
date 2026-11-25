import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { BarcodeFormat, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { searchOutline, cameraOutline, stopCircleOutline, barcodeOutline } from 'ionicons/icons';
import { ShellComponent } from '../core/shell.component';
import { SesionService } from '../core/sesion.service';
import { Analisis, AnalisisService } from '../core/analisis.service';

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}
type BarcodeDetectorConstructor = new (options?: { formats: string[] }) => BarcodeDetectorLike;
interface ProductoOFF {
  status?: number;
  product?: {
    product_name?: string;
    product_name_es?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_es?: string;
    quantity?: string;
    code?: string;
  };
}

@Component({
  standalone: true,
  selector: 'app-escanear',
  templateUrl: 'escanear.page.html',
  styleUrls: ['escanear.page.scss'],
  imports: [FormsModule, RouterLink, IonInput, IonButton, IonIcon, IonSpinner, ShellComponent],
})
export class EscanearPage implements OnDestroy {
  sesion = inject(SesionService);
  private analisis = inject(AnalisisService);

  alimento = '';
  cargando = false;
  buscandoProducto = false;
  escaneando = false;
  readonly esNativo = Capacitor.isNativePlatform();
  error = '';
  avisoCamara = '';
  resultado: Analisis | null = null;
  productoCodigo = '';
  productoMarca = '';
  video?: HTMLVideoElement;
  private stream?: MediaStream;
  private detector?: BarcodeDetectorLike;
  private frame = 0;
  private detectando = false;
  etiquetas = { alimento: 'es de ese grupo', ingrediente: 'ingrediente', posible: 'posible' };

  constructor() {
    addIcons({ searchOutline, cameraOutline, stopCircleOutline, barcodeOutline });
  }

  /** En la app (APK) se usa el lector nativo de Google ML Kit; en el navegador, BarcodeDetector. */
  private async escanearNativo() {
    this.error = '';
    try {
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!available) await BarcodeScanner.installGoogleBarcodeScannerModule();
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE, BarcodeFormat.Code128, BarcodeFormat.Code39, BarcodeFormat.Itf],
      });
      const codigo = barcodes.find((b) => b.rawValue)?.rawValue;
      if (codigo) await this.buscarProducto(codigo);
    } catch (e) {
      const msg = e instanceof Error ? e.message.toLowerCase() : '';
      if (msg.includes('cancel')) return; // el usuario cerró el lector
      this.error = 'No se pudo abrir el lector de códigos. Comprueba el permiso de cámara y que Google Play Services esté actualizado, o escribe el código manualmente.';
    }
  }

  async iniciarCamara(video?: HTMLVideoElement) {
    if (this.esNativo) { await this.escanearNativo(); return; }
    if (!video) return;
    this.error = '';
    this.avisoCamara = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error = 'Este navegador no permite acceder a la cámara. Usa HTTPS o localhost y un navegador compatible.';
      return;
    }
    const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector) {
      this.error = 'Tu navegador no incluye un lector de códigos de barras compatible. Puedes escribir el código o el nombre del producto manualmente.';
      return;
    }
    try {
      this.video = video;
      this.detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'] });
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      video.srcObject = this.stream;
      await video.play();
      this.escaneando = true;
      this.buscarCodigo();
    } catch (e) {
      this.detenerCamara();
      this.error = e instanceof Error && e.name === 'NotAllowedError'
        ? 'No se concedió permiso para usar la cámara. Habilítalo en el navegador e inténtalo otra vez.'
        : 'No se pudo iniciar la cámara. Comprueba que no esté siendo utilizada por otra aplicación.';
    }
  }

  private buscarCodigo() {
    if (!this.escaneando || !this.video || !this.detector) return;
    this.frame = requestAnimationFrame(async () => {
      if (!this.detectando && this.video && this.video.readyState >= 2) {
        this.detectando = true;
        try {
          const codigos = await this.detector!.detect(this.video);
          const codigo = codigos.find((x) => x.rawValue)?.rawValue;
          if (codigo) {
            this.detenerCamara();
            await this.buscarProducto(codigo);
          }
        } catch { /* continúa intentando mientras la cámara esté activa */ }
        finally { this.detectando = false; }
      }
      this.buscarCodigo();
    });
  }

  detenerCamara() {
    this.escaneando = false;
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    if (this.video) this.video.srcObject = null;
  }

  async buscarProducto(codigo = this.alimento.trim()) {
    if (!codigo || this.buscandoProducto || this.cargando) return;
    this.detenerCamara();
    this.error = '';
    this.resultado = null;
    this.buscandoProducto = true;
    this.productoCodigo = codigo;
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=code,product_name,product_name_es,brands,ingredients_text,ingredients_text_es,quantity`);
      if (!response.ok) throw new Error('No se pudo consultar la base de datos de productos.');
      const data = await response.json() as ProductoOFF;
      const p = data.product;
      if (data.status !== 1 || !p) throw new Error('No encontramos ese código en Open Food Facts. Puedes probar con otro código o escribir el nombre del alimento.');
      const nombre = p.product_name_es || p.product_name || `Producto ${codigo}`;
      const ingredientes = p.ingredients_text_es || p.ingredients_text || '';
      this.productoMarca = p.brands || '';
      if (!ingredientes.trim()) {
        this.alimento = nombre;
        throw new Error(`Encontramos “${nombre}”, pero la ficha no contiene ingredientes. No es posible evaluar sus alérgenos con fiabilidad. Revisa el envase o prueba otro producto.`);
      }
      const descripcion = `Producto: ${nombre}. Marca: ${p.brands || 'No informada'}. Cantidad: ${p.quantity || 'No informada'}. Ingredientes declarados en el envase/base de datos: ${ingredientes}. Analiza especialmente derivados, trazas y posibles equivalencias con las alergias del usuario.`;
      this.alimento = nombre;
      await this.ejecutarAnalisis(descripcion, nombre);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo buscar el producto.';
    } finally {
      this.buscandoProducto = false;
    }
  }

  async revisar() {
    const alimento = this.alimento.trim();
    if (!alimento || this.cargando || this.sesion.alergias.length === 0) return;
    if (/^\d{8,14}$/.test(alimento)) { await this.buscarProducto(alimento); return; }
    this.productoCodigo = '';
    this.productoMarca = '';
    await this.ejecutarAnalisis(alimento, alimento);
  }

  private async ejecutarAnalisis(texto: string, nombreVisible: string) {
    if (this.sesion.alergias.length === 0) {
      this.error = 'Primero registra tus alergias para poder comparar el producto con tu perfil.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.resultado = null;
    try {
      const r = await this.analisis.analizar(texto, this.sesion.alergias);
      this.resultado = { ...r, alimento: nombreVisible };
      this.sesion.registrarRevision({
        alimento: nombreVisible,
        fecha: Date.now(),
        peligro: r.coincidencias.length > 0,
        detalle: r.coincidencias.length
          ? 'Contiene o podría contener ' + r.coincidencias.map((c) => c.alergia.toLowerCase()).join(', ')
          : 'Sin coincidencias detectadas en los ingredientes disponibles',
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'No se pudo analizar el alimento.';
    } finally {
      this.cargando = false;
    }
  }

  ngOnDestroy() { this.detenerCamara(); }
}
