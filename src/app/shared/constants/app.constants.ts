/**
 * @description Contains constants used across the application.
 */
export class AppConstants {
  public static readonly AUTO_KEY: "auto" = 'auto';
  public static readonly BLANK_SPACE: string = ' ';
  public static readonly CLIENT_IS_READY: string = 'The client is up! Ready at';
  public static readonly COMMA_KEY: string = ',';
  public static readonly CURRENT_PORT: number = 3000;
  public static readonly DEF_PUBLIC_IP: string = '0.0.0.0';
  public static readonly DEF_USER_NAME: string = 'Nobody';
  public static readonly ELLIPSES: string = '...';
  public static readonly EMPTY_STRING: string = '';
  public static readonly MESSAGE_CREATE_KEY: string = 'message_create';
  public static readonly MESSAGE_KEY: string = 'message';
  public static readonly MX_PREFIX: string = '521';
  public static readonly MX_REGION_KEY: string = 'es-MX';
  public static readonly MX_SIMPLE_PREFIX: string = '52';
  public static readonly NO_QR_NEEDED: string = 'Client is already authenticated. No QR code is needed.';
  public static readonly NOT_REPLY: string = 'Mensaje automático. No responder.';
  public static readonly NUMERIC_KEY = 'numeric';
  public static readonly OBJECT_KEY: string = 'object';
  public static readonly ONE_DOLLAR: string = '$1';
  public static readonly PUPPETEER_PATCH_NO_SANDBOX: string = '--no-sandbox';
  public static readonly PUPPETEER_PATCH_NO_UID: string = '--disable-setuid-sandbox';
  public static readonly QR_CODE_GEN_01: string = '<img src="';
  public static readonly QR_CODE_GEN_02: string = '" alt="QR Code" />';
  public static readonly QR_GENERATED: string = 'QR code generated at';
  public static readonly QR_KEY: string = 'qr';
  public static readonly QR_ROUTE: string = '/qr';
  public static readonly READY_KEY: string = 'ready';
  public static readonly REMOTE_KEY: "remote" = 'remote';
  public static readonly SERVER_RUNNING_MESSAGE: string = 'Server running at port: 3000';
  public static readonly SESSION_KEY: string = 'wwebjs_auth_data';
  public static readonly SPANISH_KEY: string = 'spa';
  public static readonly TEL_KEY: string = 'TEL';
  public static readonly TITLE: string = 'questly-AIssistant';
  public static readonly TWO_DIGIT_KEY = '2-digit';
  public static readonly UTC_KEY: string = 'UTC';
  public static readonly WEB_VERSION_PATCH: string = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html';
  public static readonly WHATSAPP_USER_KEY: string = '@c.us';
};

export enum AuxiliarMessages {
  BankTransferPayment = 'Pago por transferencia bancaria',
  CurrentDateTime = 'Fecha y hora actual:',
  FunctionsToCall = 'Función a llamar: ',
  MessageDateTime = 'Fecha y hora del mensaje:',
  MessageReceivedFrom = 'Mensaje recibido de ',
  MyNameIs = ', mi nombre es',
  NewConversationStarted = 'Nueva conversación iniciada.',
  OrderQuantity = 'Cantidad:',
  OrderRequest = 'Me gustaría este producto de su catálogo:',
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
  FirstConcact = 'first_contact',
  GetUsersName = 'get_users_name',
  TalkToHuman = 'talk_to_human'
};

export enum ResponseMessages {
  AskTalkingToYou = `Un usuario pidió hablar directamente contigo sobre su solicitud de apoyo. Por favor, respóndele lo antes posible. Gracias 😊✨`,
  AttachMedia = 'También te adjunto los documentos o imágenes que el usuario compartió 📄📸',
  BankTransferVoucherReceived = 'Te ha enviado este comprobante de su pago por transferencia. Por favor, revísalo y verifica la transacción. Gracias 😊✨',
  ByTheWay = 'Por cierto...',
  FirstContact1 = "Parece que es la primera vez que te contactas con el asistente virtual de SEDARPE ✨\n\n¿Prefieres que te llame ",
  FirstContact2 = '? ¿O te gustaría que te llame de otra forma? 😊',
  FirstContactWithNoName = `Parece que es la primera vez que te contactas con el asistente virtual de SEDARPE ✨\n\nPrimero que nada, ¿cómo te gustaría que te llame? 😊\n\nPara poder guardar tu nombre correctamente, por favor escribe:\n\n"Me llamo *[tu nombre]*"`,
  Hello = `¡Hola! 👋`,
  ManualDeactivation = `Se ha desactivado manualmente el servicio de chatbot para el usuario con el número de teléfono:`,
  ManualDeactivationFailed = `La desactivación manual del servicio de chatbot falló para el usuario con el número de teléfono:`,
  ManualDeactivationTryAgain = 'Por favor, inténtalo de nuevo. Si no puedes desactivar un chat tras varios intentos, contacta con soporte 💬🔧',
  NoInterruptionContact = `Podrás contactarlo sin interrupciones durante las próximas 12 horas 🕒✨`,
  NotificationSystem = `¡Hola! 👋 Este es el asistente de notificaciones de SEDARPE 😊`,
  NotifyQuotationRequest = 'Solicitó información sobre los apoyos disponibles 📝\nPor favor, revisa su chat para brindarle más detalles. Aquí está su mensaje:',
  QuotationResponse = `¡Claro! 😊 Vamos a registrar tu solicitud. Si necesitas apoyo adicional o tienes preguntas, por favor envíalas por este medio.\n\nAlguien de nuestro equipo revisará los detalles y te contactará pronto. ¡Gracias por confiar en SEDARPE! ✨🌾`,
  QuotationWithImageResponse = `Gracias por compartir los detalles 😊 Vamos a procesar tu solicitud.\n\nAlguien del equipo revisará la información y te contactará pronto. Si necesitas algo más, no dudes en decírnoslo. ¡Estamos aquí para ayudarte! ✨🌾`,
  OpenTheDoor = 'acaba de avisar que está esperando atención en el centro de apoyo. Por favor, recíbelo lo antes posible 🕒✨',
  PendingMessage1 = `👤 El usuario:`,
  PendingMessage2 = `📞 Con número:`,
  StopConversation = `¡Entendido! \n\nA partir de este momento, ya no responderé más mensajes ❌\n\nSiéntete libre de enviar más detalles o preguntas. Alguien de nuestro equipo te atenderá personalmente pronto 😊`,
  ThanksForYourPayment = '¡Gracias por tu pago! 😊 He enviado el comprobante al equipo correspondiente para su revisión. 🔍📋',
  YourNameIs = 'Entendido, te llamas',
  WelcomeCustomer = `¡Bienvenid@! 🌾\n\nLe acabo de notificar a alguien del equipo que llegaste, por favor, espera un momento 🕒✨
    \nSi necesitas asistencia adicional, no dudes en mencionarlo. ¡Gracias por confiar en SEDARPE! 🌟`
};

export enum MediaNotSupportedResponses {
  Audio = 'Disculpa, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites que alguien lo escuche, solo pídeme hablar con un humano 😊👉',
  AudioComplement = 'Por cierto, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites que alguien lo escuche, solo pídeme hablar con un humano 😊👉',
  Default = 'Disculpa, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. En caso de que necesites que alguien lo vea, solo pídeme hablar con un humano 😊👉',
  DefaultComplement = 'Por cierto, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. En caso de que necesites que alguien lo vea, solo pídeme hablar con un humano 😊👉',
  Image = 'Disculpa, actualmente no ver lo que hay en las imágenes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites que alguien lo vea, solo pídeme hablar con un humano 😊👉',
  ImageComplement = 'Por cierto, actualmente no ver lo que hay en las imágenes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites que alguien lo vea, solo pídeme hablar con un humano 😊👉',
  Sticker = '¡Ups! 😕 Disculpa, no puedo ver los stickers que me envías 🚫, pero estoy seguro de que este es genial 👌',
  Video = 'Disculpa, actualmente no ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites que alguien lo vea, solo pídeme hablar con un humano 😊👉',
  VideoComplement = 'Por cierto, actualmente no ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites que alguien lo vea, solo pídeme hablar con un humano 😊👉',
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
  TimeBetweenMessages = 500
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
  public static readonly REMOVE_NON_DIGIT_CHAR = /\D/g;
  public static readonly GET_FIRST_TEN_NUMBERS = /\b\d{10}\b/;
  public static readonly GET_PHONE_NUMBER = /^.*(\d{10})@c\.us$/;
  public static readonly REMOVE_NON_ALPHABETIC_CHAR = /[^a-zA-Z]/g;
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
