/**
 * @description Contains constants used across the application.
 */
export class AppConstants {
  public static readonly BLANK_SPACE: string = ' ';
  public static readonly CLIENT_IS_READY: string = 'The client is up! Ready at';
  public static readonly CLOSING_BRACKET: string = '}';
  public static readonly COMMA_KEY: string = ',';
  public static readonly CURRENT_PORT: number = 3000;
  public static readonly DEF_PUBLIC_IP: string = '0.0.0.0';
  public static readonly DEF_USER_NAME: string = 'Nobody';
  public static readonly ELLIPSES: string = '...';
  public static readonly EMPTY_STRING: string = '';
  public static readonly FUNCTION_TYPE: 'function' = 'function';
  public static readonly MESSAGE_CREATE_KEY: string = 'message_create';
  public static readonly MESSAGE_KEY: string = 'message';
  public static readonly MX_PREFIX: string = '521';
  public static readonly MX_REGION_KEY: string = 'es-MX';
  public static readonly MX_SIMPLE_PREFIX: string = '52';
  public static readonly NO_QR_NEEDED: string = 'Client is already authenticated. No QR code is needed.';
  public static readonly NOT_REPLY: string = 'Mensaje automático. No responder.';
  public static readonly NUMERIC_KEY = 'numeric';
  public static readonly OBJECT_KEY: 'object' = 'object';
  public static readonly ONE_DOLLAR: string = '$1';
  public static readonly OPENING_BRACKET: string = '{';
  public static readonly PUPPETEER_PATCH_NO_SANDBOX: string = '--no-sandbox';
  public static readonly PUPPETEER_PATCH_NO_UID: string = '--disable-setuid-sandbox';
  public static readonly QR_CODE_GEN_01: string = '<img src="';
  public static readonly QR_CODE_GEN_02: string = '" alt="QR Code" />';
  public static readonly QR_GENERATED: string = 'QR code generated at';
  public static readonly QR_KEY: string = 'qr';
  public static readonly QR_ROUTE: string = '/qr';
  public static readonly READY_KEY: string = 'ready';
  public static readonly REMOTE_KEY: 'remote' = 'remote';
  public static readonly SERVER_RUNNING_MESSAGE: string = 'Server running at port: 3000';
  public static readonly SESSION_KEY: string = 'wwebjs_auth_data';
  public static readonly SPANISH_KEY: string = 'spa';
  public static readonly STRING_TYPE: 'string' = 'string';
  public static readonly TEL_KEY: string = 'TEL';
  public static readonly TITLE: string = 'questly-AIssistant';
  public static readonly TWO_DIGIT_KEY = '2-digit';
  public static readonly UTC_KEY: string = 'UTC';
  public static readonly WEB_VERSION_PATCH: string = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html';
  public static readonly WHATSAPP_USER_KEY: string = '@c.us';
};

export enum AuxiliarMessages {
  AvailableDates = 'Fechas disponibles para el servicio ',
  BankTransferPayment = 'Pago por transferencia bancaria',
  CurrentDateTime = 'Fecha y hora actual:',
  FunctionsToCall = 'Función a llamar: ',
  MessageDateTime = 'Fecha y hora del mensaje:',
  MessageReceivedFrom = 'Mensaje recibido de ',
  MyNameIs = ', mi nombre es',
  NewConversationStarted = 'Nueva conversación iniciada.',
  NotAvailableDates = 'Sin fechas disponibles. Preguntar si desea realizar la búsqueda de otro rango de fechas o saber cuál es la más próxima',
  OrderQuantity = 'Cantidad:',
  OrderRequest = 'Me gustaría este producto de su catálogo:',
  summarizeDates = 'Resume las fechas disponibles en una lista y comparte la URL específica para el servicio buscado. Si no se especificó un rango de fechas, no dar más de 3 opciones. Evita el uso de asteriscos (*)',
  TempContext = 'Contexto temporal creado para el número: '
};

export class AvailableGptModels {
  public static readonly GPT_4_O = 'gpt-4o';
};

export enum GptRoles {
  Assistant = 'assistant',
  Function = 'function',
  System = 'system',
  User = 'user'
};

export enum FunctionNames {
  DetectOrderRequest = 'detect_order_request',
  GetUsersName = 'get_users_name',
  TalkToHuman = 'talk_to_human'
};

export enum ResponseMessages {
  AskTalkingToYou = `Pidió hablar directamente con un humano. Por favor, respóndele lo antes posible. Gracias 😊`,
  AttachMedia = 'También te adjunto las imágenes que nos compartió 📸',
  BankTransferVoucherReceived = 'Te ha enviado este comprobante de su pago por transferencia. Por favor, revísalo y verifica la transacción. Gracias 😊',
  ByTheWay = 'Por cierto...',
  FirstContact1 = "Parece que es la primera vez que te contactas con el asistente virtual de Don Moy 🌭\n\n¿Prefieres que te llame ",
  FirstContact2 = '? ¿O te gustaría que te llame de otra forma? 😊',
  FirstContactWithNoName = `Parece que es la primera vez que te contactas con el asistente virtual de Don Moy 🌭\n\nPrimero que nada ¿Cómo te gustaría que te llame? 😊\n\nPara poder guardar tu nombre correctamente, por favor escribe:\n\n"Me llamo *[tu nombre]*"`,
  Hello = `¡Hola! 👋`,
  ManualDeactivation = `Se ha desactivado manualmente el servicio de chatbot para el usuario con el número de teléfono:`,
  ManualDeactivationFailed = `La desactivación manual del servicio de chatbot falló para el usuario con el número de teléfono:`,
  ManualDeactivationTryAgain = 'Por favor, inténtalo de nuevo. Si no puedes desactivar un chat tras varios intentos, contacta con soporte 💬🔧',
  NoInterruptionContact = `Podrás contactarlo sin interrupciones durante las próximas 12 horas 🕒✨`,
  NotificationSystem = `¡Hola! 👋 Este es el asistente de notificaciones de Don Moy 🌭`,
  NotifyOrderRequest = 'Solicitó realizar un pedido 🛒✨\nPor favor, revisa su chat para confirmar los detalles. Aquí está su mensaje:',
  OrderResponse = `¡Perfecto! 😊 Vamos a procesar tu pedido. Por favor, envíanos los detalles (productos y cantidades) y confirma si prefieres pagar en efectivo o por transferencia bancaria.\n\nMuchas gracias por tu preferencia. ¡Estamos aquí para ayudarte! ✨🌭`,
  OpenTheDoor = 'acaba de avisar que está esperando afuera, ¡ábrele lo antes posible! 🕒✨',
  PendingMessage1 = `👤 El usuario:`,
  PendingMessage2 = `📞 Con número:`,
  StopConversation = `¡Entendido! A partir de este momento ya no podré responderte ❌\n\nSi necesitas más ayuda, un humano te atenderá pronto. 🌭`,
  ThanksForYourPayment = '¡Gracias por tu pago! 😊 He enviado el comprobante de tu transferencia al equipo para que la revise. 🔍📋',
  YourNameIs = 'Entiendo, te llamas',
  WelcomeCustomer = `¡Bienvenid@! 🌭\n\nGracias por visitarnos en Don Moy. Por favor, espera unos minutos mientras preparamos todo para ti 🕒✨\n\nSi necesitas algo más, avísanos 😊.`
};

export enum MediaNotSupportedResponses {
  Audio = 'Disculpa, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites hablar con un humano, solo pídelo 😊👉',
  AudioComplement = 'Por cierto, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites hablar con un humano, solo pídelo 😊👉',
  Default = 'Disculpa, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. Si necesitas atención de un humano, solo pídelo 😊👉',
  DefaultComplement = 'Por cierto, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. Si necesitas atención de un humano, solo pídelo 😊👉',
  Image = 'Disculpa, actualmente no puedo ver lo que hay en las imágenes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites hablar con un humano, solo pídelo 😊👉',
  ImageComplement = 'Por cierto, actualmente no puedo ver lo que hay en las imágenes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites hablar con un humano, solo pídelo 😊👉',
  Sticker = '¡Ups! 😕 Disculpa, no puedo ver los stickers que me envías 🚫, pero seguro son geniales 👌✨',
  Video = 'Disculpa, actualmente no puedo ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites hablar con un humano, solo pídelo 😊👉',
  VideoComplement = 'Por cierto, actualmente no puedo ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites hablar con un humano, solo pídelo 😊👉',
};

export enum MediaTypes {
  Audio = 'audio',
  Base64 = 'base64',
  Chat = 'chat',
  E2ENotification = 'e2e_notification',
  Image = 'image',
  Mixed = 'mixed',
  NotificationTemplate = 'notification_template',
  Order = 'order',
  Sticker = 'sticker',
  Video = 'video',
  VoiceMessage = 'ptt'
};

export enum TimeoutDurations {
  TimeBetweenMessages = 1000
};

export enum ErrorMessages {
  CallingError = 'Error calling OpenAi endpoint',
  ContextNotFound = 'Context not found for chat ID:',
  DefaultMessage = 'Controlled error: ',
  FailedDeletingContext = 'Failed trying to delete context for chat ID:',
  FailedUpdatingContext = 'Failed trying to update context for chat ID:',
  ImageDataNotFound = 'No image data found',
  NameObtentionFailed = 'Error during name obtention for user:',
  NotificationFailed = 'Failed to send notification to number:',
  RateLimitError = 'The OpenAi account has exceded its available balance: ',
  ReplyMessageFailed = 'Failed to reply to the message:',
  shouldRereshQrView = 'QR code is not generated yet. Please reload this page.',
  TesseractProccesingError = 'Error processing image with Tesseract:',
  UnexpectedError = 'There has been an unexpected error: '
};

export enum NotificationContacts {
  Broadcast = 'status@broadcast',
  Business = '5219831079501@c.us',
  MainContact = '5219831844892@c.us',
  TestContact = '5219831381983@c.us',
  WhatsApp = '0@c.us'
};

export const ContactsToIgnore: Array<string> = [
  NotificationContacts.Broadcast,
  NotificationContacts.WhatsApp
];

export class RegexExpressions {
  public static readonly GET_FIRST_TEN_NUMBERS = /\b\d{10}\b/;
  public static readonly GET_PHONE_NUMBER = /^.*(\d{10})@c\.us$/;
  public static readonly JSON_COMPARE = /{[\s\S]*}/;
  public static readonly REMOVE_NON_ALPHABETIC_CHAR = /[^a-zA-Z]/g;
  public static readonly REMOVE_NON_DIGIT_CHAR = /\D/g;
  public static readonly V_CARD_PHONE_EXTRACTOR = /(\+?\d{1,4}?\s?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/;
};

export enum DefinedPaths {
  BellLocation = 'media/images/bell_location.jpg'
};

export const AppPatterns = {
  bankPatterns: [
    /\btransferencia\b/,
    /\bspei\b/,
    /\bclabe\b/,
    /\bcomprobante\b/
  ],
  namePatterns: [
    /\bmi nombre es\b/,
    /\bme llamo\b/,
    /\bsoy\b/,
    /\bmi nombre completo es\b/,
    /\bpuedes llamarme\b/,
    /\bme puedes llamar\b/,
    /\bme dicen\b/,
    /\bme digas\b/,
    /\bllámame\b/,
    /\bte presento a\b/,
    /\bquiero presentarme\b/,
    /\bmi apodo es\b/,
    /\bme conocen como\b/,
    /\bmis amigos me llaman\b/,
    /\bpuedes decirme\b/,
    /\bque me llames\b/,
    /\bpermíteme presentarme\b/,
    /\bte digo mi nombre\b/,
    /\bmi nombre de pila es\b/,
    /\bpara los amigos soy\b/,
    /\bme llamaban\b/,
    /\bse me conoce como\b/,
    /\bbuenos días, soy\b/,
    /\bhola, soy\b/,
    /\bte cuento que soy\b/,
    /\bme presento, soy\b/
  ]
};
