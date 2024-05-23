/**
 * @description Contains constants used across the application.
 */
export class AppConstants {
  public static readonly AUTO_KEY: "auto" = 'auto';
  public static readonly BLANK_SPACE: string = ' ';
  public static readonly CLIENT_IS_READY: string = 'The client is up!';
  public static readonly ELLIPSES: string = '...';
  public static readonly EMPTY_STRING: string = '';
  public static readonly MESSAGE_KEY: string = 'message';
  public static readonly OBJECT_KEY: string = 'object';
  public static readonly ONE_DOLLAR: string = '$1';
  public static readonly QR_KEY: string = 'qr';
  public static readonly READY_KEY: string = 'ready';
  public static readonly REMOTE_KEY: "remote" = 'remote';
  public static readonly SERVER_RUNNING_MESSAGE: string = 'Servidor corriendo en http://localhost:3000';
  public static readonly TITLE: string = 'questly-AIssistant';
  public static readonly WEB_VERSION_PATCH: string = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html';
};

export enum AuxiliarMessages {
  FunctionsToCall = 'Función a llamar: ',
  MessageReceivedFrom = 'Mensaje recibido de ',
  MyNameIs = ', mi nombre es'
};

export class AvailableGptModels {
  public static readonly GPT_3_5_TURBO_16K_0613 = 'gpt-3.5-turbo-16k-0613';
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
  MediaDetected = 'media_detected',
  TalkToHuman = 'talk_to_human'
};

export enum ResponseMessages {
  AskPreferedName1 = 'Su nombre completo es: ',
  AskPreferedName2 = '. Saludar por su primer nombre y preguntar si ese nombre le parece bien o prefiere otro.',
  FirstConcact1 = "¡Hola! Parece que es la primera vez que te contactas con el asistente virtual de Ale's Place. Veo que te llamas ",
  FirstConcact2 = ', ¿es correcto? ¿O prefieres que te llame de otra forma? 😊',
  GetCustomResponse = 'No te preocupes, quizás yo no tengo esa información, ¡pero Ale seguro que sí! 🌸 Si quieres hablar con ella, solo dime, "Quiero hablar con Ale". Si no, ¡puedo seguir ayudándote! 🙌',
  MediaNotSupported = 'Disculpa, actualmente no puedo responder mensajes de voz 🔊, fotos 📸 o vídeos 🎥. En caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  MediaNotSupportedComplement = 'Por cierto, actualmente no puedo responder mensajes de voz 🔊, fotos 📸 o vídeos 🎥. En caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  PendingMessage1 = `¡Hola! 👋 Este es el asistente de notificaciones de Ale's Place 😊, parece que el usuario "`,
  PendingMessage2 = `", con el número de teléfono 📞`,
  PendingMessage3 = `quiere contactar directamente contigo, por favor, respóndole lo antes posible. Gracias 😊✨`,
  RedirectToWebsite = 'Entra a www.alesplace.com/catalogo-de-servicios para agendar una cita',
  StopConversation = '¡Entendido! A partir de este momento ya no podré responderte. Ale se pondrá en contacto contigo pronto 😊'
}

export enum TimeoutDurations {
  TimeBetweenMessages = 8000
};

export enum ErrorMessages {
  CallingError = 'Error calling OpenAi endpoint',
  ContextNotFound = 'Context not found for chat ID:',
  DefaultMessage = 'Controlled error: ',
  FailedUpdatingContext = 'Failed trying to update context for chat ID:',
  NotificationFailed = 'Failed to send notification to number:',
  RateLimitError = 'The OpenAi account has exceded its available balance: ',
  UnexpectedError = 'There has been an unexpected error: '
};

export enum NotificationContacts {
  MainContact = '5219831844892@c.us',
  TestContact = '5219831381983@c.us'
}

export class RegexExpressions {
  public static readonly GET_JUST_NUMBER = /^.*(\d{10})@c\.us$/
}
