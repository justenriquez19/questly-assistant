import axios, { AxiosResponse } from 'axios';

import { SlotsEndpointResponse } from '../shared/interfaces/amelia-interfaces';

const BASE_URL = process.env.AMELIA_API_URL as string;
const AMELIA_API_KEY = process.env.AMELIA_API_KEY as string;

export class AmeliaService {
  private readonly action: string = 'wpamelia_api';

  /**
   * @description Fetches available slots for a specific service within a given time range.
   * @param {number} serviceId - The ID of the service to fetch slots for.
   * @param {string} startDateTime - The start date and time for the query.
   * @param {string} endDateTime - The end date and time for the query.
   * @returns {Promise<Array<string>>} - A promise that resolves to an array of formatted slot strings.
   */
  public async getSlots(serviceId: number, startDateTime: string, endDateTime: string): Promise<Array<string>> {
    const url = `${BASE_URL}?action=${this.action}&call=/api/v1/slots`;

    try {
      const response: AxiosResponse<{ data: SlotsEndpointResponse }> = await axios.get(url, {
        params: {
          serviceId,
          startDateTime,
          endDateTime,
        },
        headers: {
          Amelia: AMELIA_API_KEY,
        }
      });

      if (response.status === 200) {
        return this.getFormatedDates(response.data.data);
      } else {
        throw new Error(`Error al obtener los slots: ${response.status}`);
      }
    } catch (error) {
      console.error('Error al llamar a la API de Amelia:', error);
      throw error;
    }
  }

  /**
   * @description Formats the slots data into an array of readable strings.
   * @param {SlotsEndpointResponse} slotsResponse - The response object containing slot data from the API.
   * @returns {Array<string>} - An array of formatted slot strings in the format "YYYY-MM-DD at HH:mmam/pm".
   */
  private getFormatedDates(slotsResponse: SlotsEndpointResponse): Array<string> {
    const result: Array<string> = [];
    const slots = slotsResponse.slots;

    for (const date in slots) {
      const times = Object.keys(slots[date]);
      const groupedByHour = times.reduce((acc: any, time: any) => {
        const hour = time.split(':')[0];
        if (!acc[hour]) acc[hour] = time;
        return acc;
      }, {});

      for (const hour in groupedByHour) {
        const time = groupedByHour[hour];
        const [hour24, minutes] = time.split(':').map(Number);
        const period = hour24 >= 12 ? 'pm' : 'am';
        const hour12 = hour24 % 12 || 12;
        result.push(`${date} a las ${hour12}:${minutes.toString().padStart(2, '0')}${period}`);
      }
    }

    return result;
  }
}
