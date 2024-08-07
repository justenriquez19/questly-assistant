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
  public static readonly MX_PREFIX: string = '521';
  public static readonly MX_SIMPLE_PREFIX: string = '52';
  public static readonly NOT_REPLY: string = 'Mensaje automático. No responder.';
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
  public static readonly SPANISH_KEY: string = 'spa';
  public static readonly TEL_KEY: string = 'TEL';
  public static readonly TITLE: string = 'questly-AIssistant';
  public static readonly WEB_VERSION_PATCH: string = 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html';
  public static readonly WHATSAPP_USER_KEY: string = '@c.us';
};

export enum AuxiliarMessages {
  BankTransferPayment = 'Pago por transferencia bancaria',
  FunctionsToCall = 'Función a llamar: ',
  MessageReceivedFrom = 'Mensaje recibido de ',
  MyNameIs = ', mi nombre es',
  OrderQuantity = 'Cantidad:',
  OrderRequest = 'Me gustaría este producto de su catálogo:',
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
  DetectQuotationRequest = 'detect_quotation_request',
  FirstConcact = 'first_contact',
  GetPersonalAssistance = 'get_personal_assistance',
  GetUsersName = 'get_users_name',
  NotifyIHaveArrived = 'notify_i_have_arrived',
  TalkToAle = 'talk_to_ale'
};

export enum ResponseMessages {
  AskTalkingToYou = `Pidió hablar directamente contigo, por favor, respóndole lo antes posible. Gracias 😊✨`,
  AttachMedia = 'También te adjunto las imágenes que nos compartió  📸',
  BankTransferVoucherReceived = 'Te ha enviado este comprobante de su pago por transferencia. Por favor, revísalo y verifica la transacción. Gracias 😊✨',
  ByTheWay = 'Por cierto...',
  FirstContact1 = "Parece que es la primera vez que te contactas con el asistente virtual de Ale's Place ✨\n\n¿Prefieres que te llame ",
  FirstContact2 = '? ¿O te gustaría que te llame de otra forma? 😊',
  FirstContactWithNoName = `Parece que es la primera vez que te contactas con el asistente virtual de Ale's Place ✨\n\nPrimero que nada ¿Cómo te gustaría que te llame? 😊\n\nPara poder guardar tu nombre correctamente, por favor escribe:\n\n"Me llamo *[tu nombre]*"`,
  Hello = `¡Hola! 👋`,
  ManualDeactivation = `Se ha desactivado manualmente el servicio de chatbot para el usuario con el número de teléfono:`,
  ManualDeactivationFailed = `La desactivación manual del servicio de chatbot falló para el usuario con el número de teléfono:`,
  ManualDeactivationTryAgain = 'Por favor, inténtalo de nuevo. Si no puedes desactivar un chat tras varios intentos, contacta con soporte 💬🔧',
  NoInterruptionContact = `Podrás contactarlo sin interrupciones durante las próximas 12 horas 🕒✨`,
  NotificationSystem = `¡Hola! 👋 Este es el asistente de notificaciones de Ale's Place 😊`,
  NotifyQuotationRequest = 'Solicitó una cotización 💰\nPor favor, revisa su chat para poder brindarle un estimado. Aquí está su mensaje:',
  QuotationResponse = `¡Lindo diseño! 😊 Vamos a realizar la cotización para ti.\n\nAle te contactará pronto con un estimado. Si tienes alguna otra pregunta o necesitas más información, no dudes en decírnoslo.\n\n¡Estamos aquí para ayudarte! ✨💅`,
  OpenTheDoor = 'acaba de avisar que está esperando afuera, ¡ábrele lo antes posible! 🕒✨',
  PendingMessage1 = `👤 El usuario:`,
  PendingMessage2 = `📞 Con número:`,
  StopConversation = `¡Entendido! \n\nA partir de este momento ya no podré responderte ❌\n\nSiéntete libre de enviar más detalles sobre lo que quieras platicarle 🌸
    \nAle te contactará pronto para atenderte personalmente 😊`,
  ThanksForYourPayment = '¡Gracias por tu pago! 😊 He enviado el comprobante de tu transferencia a Ale para que la revise. 🔍📋',
  YourNameIs = 'Entiendo, te llamas',
  WelcomeCustomer = `¡Bienvenid@! 🌸\n\nLe acabo de notificar a Ale que llegaste, por favor, espera un momento 🕒✨
    \nNo olvides tocar el timbre para ser atendida lo antes posible 🔔\n\nEstá del lado derecho de la reja, un poco hacia arriba.`
};

export enum MediaNotSupportedResponses {
  Audio = 'Disculpa, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites que Ale lo escuche, solo pídeme hablar con ella 😊👉',
  AudioComplement = 'Por cierto, actualmente no puedo escuchar mensajes de voz 🔊❌ ¿Podrías escribirme? O en caso de que necesites que Ale lo escuche, solo pídeme hablar con ella 😊👉',
  Default = 'Disculpa, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. En caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  DefaultComplement = 'Por cierto, actualmente no puedo responder mensajes de voz 🔊, fotos 📸, stickers 🖼️ o vídeos 🎥. En caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  Image = 'Disculpa, actualmente no ver lo que hay en las imágenes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  ImageComplement = 'Por cierto, actualmente no ver lo que hay en las imágenes que me envías 🖼️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  Sticker = '¡Ups! 😕 Disculpa, no puedo ver los stickers que me envías 🚫, pero estoy seguro de que este es genial 👌',
  Video = 'Disculpa, actualmente no ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
  VideoComplement = 'Por cierto, actualmente no ver lo que hay en los vídeos que me envías 📽️❌ ¿Podrías describirlo? O en caso de que necesites que Ale lo vea, solo pídeme hablar con ella 😊👉',
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
  TimeBetweenMessages = 16000
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
