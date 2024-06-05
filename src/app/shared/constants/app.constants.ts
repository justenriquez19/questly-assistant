/**
 * @description Contains constants used across the application.
 */
export class AppConstants {
  public static readonly AUTO_KEY: "auto" = 'auto';
  public static readonly BLANK_SPACE: string = ' ';
  public static readonly CLIENT_IS_READY: string = 'The client is up!';
  public static readonly CURRENT_PORT: number = 3000;
  public static readonly DEF_PUBLIC_IP: string = '0.0.0.0';
  public static readonly DEF_USER_NAME: string = 'Nobody';
  public static readonly ELLIPSES: string = '...';
  public static readonly EMPTY_STRING: string = '';
  public static readonly MESSAGE_CREATE_KEY: string = 'message_create';
  public static readonly MESSAGE_KEY: string = 'message';
  public static readonly NOT_REPLY: string = 'Mensaje automático. No responder';
  public static readonly OBJECT_KEY: string = 'object';
  public static readonly ONE_DOLLAR: string = '$1';
  public static readonly PUPPETEER_PATCH_NO_SANDBOX: string = '--no-sandbox';
  public static readonly PUPPETEER_PATCH_NO_UID: string = '--disable-setuid-sandbox';
  public static readonly QR_CODE_GEN_01: string = '<img src="';
  public static readonly QR_CODE_GEN_02: string = '" alt="QR Code" />';
  public static readonly QR_KEY: string = 'qr';
  public static readonly QR_ROUTE: string = '/qr';
  public static readonly READY_KEY: string = 'ready';
  public static readonly REMOTE_KEY: "remote" = 'remote';
  public static readonly SERVER_RUNNING_MESSAGE: string = 'Server running at port: 3000';
  public static readonly TEL_KEY: string = 'TEL';
  public static readonly TITLE: string = 'questly-AIssistant';
  public static readonly WEB_VERSION_PATCH: string = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html';
};

export enum AuxiliarMessages {
  FunctionsToCall = 'Función a llamar: ',
  MessageReceivedFrom = 'Mensaje recibido de ',
  MyNameIs = ', mi nombre es',
  TempContext = 'Contexto temporal creado para el número: '
};

export class AvailableGptModels {
  public static readonly GPT_3_5_TURBO_16K_0613 = 'gpt-3.5-turbo-16k-0613';
  public static readonly GPT_4_O = 'gpt-4o';
};

export enum GptRoles {
  Assistant = 'assistant',
  Function = 'function',
  System = 'system',
  User = 'user'
};

export enum FunctionNames {
  AddApointment = 'add_apointment',
  FirstConcact = 'first_contact',
  GetCustomResponse = 'get_custom_response',
  GetPersonalAssistance = 'get_personal_assistance',
  MediaDetected = 'media_detected',
  TalkToAle = 'talk_to_ale',
  UpdateUserName = 'update_user_name'
};

export enum ResponseMessages {
  FirstContact1 = "¡Hola! 👋 Parece que es la primera vez que te contactas con el asistente virtual de Ale's Place ✨\n\nPrimero que nada, veo que te llamas ",
  FirstContact2 = ', ¿verdad? ¿O prefieres que te llame de otra forma? 😊',
  FirstContactWithNoName = `¡Hola! 👋 Parece que es la primera vez que te contactas con el asistente virtual de Ale's Place ✨\n\nPrimero que nada ¿Cómo te gustaría que te llame? 😊`,
  GetCustomResponse = 'No te preocupes, quizás yo no tengo esa información, ¡pero Ale seguro que sí! 🌸 Si quieres hablar con ella, solo dime, "Quiero hablar con Ale". Si no, ¡puedo seguir ayudándote! 🙌',
  ManualDeactivation = `Se ha desactivado manualmente el servicio de chatbot para el usuario con el número de teléfono:`,
  NoInterruptionContact = `Podrás contactarlo sin interrupciones durante las próximas 12 horas 🕒✨`,
  NotificationSystem = `¡Hola! 👋 Este es el asistente de notificaciones de Ale's Place 😊`,
  PendingMessage1 = `👤 El usuario:`,
  PendingMessage2 = `📞 Con número:`,
  PendingMessage3 = `Pidió hablar directamente contigo, por favor, respóndole lo antes posible. Gracias 😊✨`,
  RedirectToWebsite = 'Entra a www.alesplace.com/catalogo-de-servicios para agendar una cita',
  StopConversation = `¡Entendido! \n\nA partir de este momento ya no podré responderte ❌\n\nSiéntete libre de enviar más detalles sobre lo que quieras platicarle 🌸
  \nAle te contactará pronto para atenderte personalmente 😊`,
  YourNameIs = 'Entiendo, te llamas'
}

export enum MediaNotSupportedResponses {
  Audio = 'Disculpa, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites que Ale lo escuche, solo pídeme hablar con ella 😊👉',
  AudioComplement = 'Por cierto, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites que Ale lo escuche, solo pídeme hablar con ella 😊👉',
  Default = 'Disculpa, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. En caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  DefaultComplement = 'Por cierto, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. En caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  Image = 'Disculpa, actualmente no ver lo que hay en las imágnes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  ImageComplement = 'Por cierto, actualmente no ver lo que hay en las imágnes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  Sticker = '¡Ups! 😕 Disculpa, no puedo ver los stickers que me envías 🚫, pero estoy seguro de que este es genial 👌',
  Video = 'Disculpa, actualmente no ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  VideoComplement = 'Por cierto, actualmente no ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
}

export enum MediaTypes {
  Audio = 'audio',
  Chat = 'chat',
  Image = 'image',
  Mixed = 'mixed',
  Sticker = 'sticker',
  Video = 'video',
  VoiceMessage = 'ptt'
}

export enum TimeoutDurations {
  TimeBetweenMessages = 4000
};

export enum ErrorMessages {
  CallingError = 'Error calling OpenAi endpoint',
  ContextNotFound = 'Context not found for chat ID:',
  DefaultMessage = 'Controlled error: ',
  FailedDeletingContext = 'Failed trying to delete context for chat ID:',
  FailedUpdatingContext = 'Failed trying to update context for chat ID:',
  NotificationFailed = 'Failed to send notification to number:',
  RateLimitError = 'The OpenAi account has exceded its available balance: ',
  shouldRereshQrView = 'QR code is not generated yet. Please reload this page.',
  UnexpectedError = 'There has been an unexpected error: '
};

export enum NotificationContacts {
  MainContact = '5219831844892@c.us',
  TestContact = '5219831381983@c.us'
}

export class RegexExpressions {
  public static readonly REMOVE_NON_DIGIT_CHAR = /\D/g;
  public static readonly GET_FIRST_TEN_NUMBERS = /\b\d{10}\b/;
  public static readonly GET_PHONE_NUMBER = /^.*(\d{10})@c\.us$/;
  public static readonly REMOVE_NON_ALPHABETIC_CHAR = /[^a-zA-Z]/g;
  public static readonly V_CARD_PHONE_EXTRACTOR = /(\+?\d{1,4}?\s?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/;
}

export enum PropertiesDescription {
  UserName = 'El primer nombre del usuario sin apellidos'
}
