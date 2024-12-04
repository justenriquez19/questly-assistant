import axios, { AxiosResponse } from 'axios';
import puppeteer from 'puppeteer';

interface CurpRequestPayload {
  curp: string;
  tipoBusqueda: 'curp';
}

interface DataRequestPayload {
  claveEntidad: string;
  fechaNacimiento: string;
  nombres: string;
  primerApellido: string;
  segundoApellido?: string;
  sexo: 'M' | 'H';
  tipoBusqueda: 'datos';
}

interface CurpResponseRecord {
  // Define la estructura basada en la respuesta del API
}

interface CurpResponse {
  registros: CurpResponseRecord[];
  mensaje: string;
  codigo: string;
}

export class RenapoCURPService {
  private readonly url: string = 'https://www.gob.mx/v1/renapoCURP/consulta';
  private readonly headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.gob.mx/',
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
  };

  /**
    * Captura la respuesta de la solicitud POST realizada a `https://www.gob.mx/v1/renapoCURP/consulta`.
    * @param curp La CURP a consultar.
    * @returns Respuesta de la API.
    */
  public async fetchCurpData(curp: string): Promise<any> {
    const browser = await puppeteer.launch({ headless: false }); // Cambia a `true` en producción
    const page = await browser.newPage();

    try {
      await page.goto('https://www.gob.mx/curp');

      // Configura el valor del campo CURP
      await page.evaluate((curpValue) => {
        const input = document.querySelector('#curpinput') as HTMLInputElement;
        input.value = curpValue;
      }, curp);

      // Intercepta las solicitudes de red
      const [response] = await Promise.all([
        page.waitForResponse((response) =>
          response.url() === 'https://www.gob.mx/v1/renapoCURP/consulta' &&
          response.request().method() === 'POST'
        ),
        // Clic en el botón Buscar
        page.click('button[type="submit"]'),
      ]);

      // Obtén los datos de la respuesta
      const responseData = await response.json();

      if (responseData.codigo === '01') {
        return { data: responseData.registros[0], message: responseData.mensaje };
      } else {
        return { data: null, message: responseData.mensaje };
      }
    } catch (error) {
      console.error('Error capturando la respuesta:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Consulta CURP con datos personales.
   * @param data Datos personales requeridos para la búsqueda.
   * @returns CURP asociado o mensaje de error.
   */
  public async getCurpFromData(data: DataRequestPayload): Promise<{ data: CurpResponseRecord | null; message: string }> {
    if (!this.validateDataPayload(data)) {
      throw new Error('Invalid data payload.');
    }

    try {
      const response: AxiosResponse<CurpResponse> = await axios.post(this.url, data, { headers: this.headers });

      if (response.data.codigo === '01') {
        return { data: response.data.registros[0], message: response.data.mensaje };
      } else {
        return { data: null, message: response.data.mensaje };
      }
    } catch (error) {
      console.error('Error fetching CURP from data:', error);
      throw error;
    }
  }

  /**
   * Valida los datos requeridos para la consulta por datos personales.
   * @param data Datos a validar.
   * @returns Verdadero si los datos son válidos, falso en caso contrario.
   */
  private validateDataPayload(data: DataRequestPayload): boolean {
    const requiredFields: Array<keyof DataRequestPayload> = ['claveEntidad', 'fechaNacimiento', 'nombres', 'primerApellido', 'sexo'];

    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Field ${field} is required.`);
        return false;
      }
    }

    if (!this.validateClave(data.claveEntidad)) {
      console.error(`Invalid claveEntidad: ${data.claveEntidad}`);
      return false;
    }

    if (!this.validateDate(data.fechaNacimiento)) {
      console.error(`Invalid fechaNacimiento: ${data.fechaNacimiento}`);
      return false;
    }

    if (!this.validateSex(data.sexo)) {
      console.error(`Invalid sexo: ${data.sexo}`);
      return false;
    }

    return true;
  }

  private validateClave(clave: string): boolean {
    const validClaves = [
      'AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH', 'DF', 'DG', 'GT', 'GR', 'HG', 'JC', 'MC', 'MN', 'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP',
      'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS', 'NE',
    ];
    return validClaves.includes(clave.toUpperCase());
  }

  private validateDate(date: string): boolean {
    // Ajusta el formato de fecha si es necesario
    const pattern = /^(3[0-1]|[1-2][0-9]|0[1-9])\/(0[1-9]|1[0-2])\/[1-2][0-9]{3}$/;
    return pattern.test(date);
  }

  private validateSex(sex: string): boolean {
    return ['M', 'H'].includes(sex.toUpperCase());
  }
}
