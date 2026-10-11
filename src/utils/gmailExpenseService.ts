import { GoogleAuthProvider, signInWithPopup, auth, googleProvider, getGmailAccessToken, setGmailAccessToken } from '../lib/firebase';
import { MonthlyExtraExpenseCategory } from '../types';

export interface ExtractedEmailExpense {
  id: string;
  messageId: string;
  sender: string;
  subject: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number;
  currency: string;
  suggestedCategory: MonthlyExtraExpenseCategory;
  categoryLabel: string;
  confidence: number;
  snippet: string;
  paymentMethod: string;
  isAlreadyImported?: boolean;
}

// Request fresh Google OAuth access token with Gmail scope
export async function acquireGmailAccessToken(): Promise<string> {
  const currentToken = getGmailAccessToken();
  if (currentToken) {
    return currentToken;
  }

  const gmailProvider = new GoogleAuthProvider();
  gmailProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  gmailProvider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, gmailProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('No se pudo obtener el token de acceso de Google Gmail.');
  }

  setGmailAccessToken(credential.accessToken);
  return credential.accessToken;
}

// List messages from Gmail matching purchase / expense queries
export async function fetchPurchaseEmails(
  token: string,
  daysBack: number = 30,
  customQuery?: string
): Promise<{ expenses: ExtractedEmailExpense[]; totalFound: number; scanLog: string[] }> {
  const scanLog: string[] = [];
  
  // Queries specialized in exact Bancolombia and ACH/PSE Colombia senders
  const defaultQueryTerms = [
    'from:alertasynotificaciones@an.notificacionesbancolombia.com',
    'from:serviciopse@achcolombia.com.co',
    'alertasynotificaciones@an.notificacionesbancolombia.com',
    'serviciopse@achcolombia.com.co',
    'from:notificacionesbancolombia.com',
    'from:achcolombia.com.co',
    'bancolombia',
    'comprobante debito',
    'comprobante credito',
    'pago por pse',
    'nequi'
  ];

  let queryStr = '';
  if (customQuery && customQuery.trim().length > 0) {
    queryStr = `${customQuery.trim()} newer_than:${daysBack}d`;
  } else {
    // If no custom query, target these exact senders and Colombian banking notifications
    queryStr = `(from:alertasynotificaciones@an.notificacionesbancolombia.com OR from:serviciopse@achcolombia.com.co OR bancolombia OR pse) newer_than:${daysBack}d`;
  }

  scanLog.push(`Ejecutando búsqueda en Gmail con filtro: ${queryStr}`);
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(queryStr)}&maxResults=40`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      setGmailAccessToken(null);
      throw new Error('Sesión de Gmail expirada. Por favor vuelve a conectar con Google.');
    }
    const errText = await response.text();
    throw new Error(`Error consultando Gmail (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const messages = data.messages || [];
  scanLog.push(`Mensajes brutos localizados en la bandeja: ${messages.length}`);

  if (messages.length === 0) {
    return { expenses: [], totalFound: 0, scanLog };
  }

  // Fetch individual message details in batches
  const extractedExpenses: ExtractedEmailExpense[] = [];

  for (const msg of messages.slice(0, 30)) {
    try {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
      const msgRes = await fetch(msgUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (!msgRes.ok) continue;

      const msgData = await msgRes.json();
      const parsed = parseExpenseFromEmail(msgData);
      if (parsed) {
        extractedExpenses.push(parsed);
      }
    } catch (e) {
      console.warn('Error parsing message', msg.id, e);
    }
  }

  scanLog.push(`Gastos identificados con monto y comercio válido: ${extractedExpenses.length}`);
  return { expenses: extractedExpenses, totalFound: messages.length, scanLog };
}

// Helper to recursively extract text from all MIME payload parts (text/plain and text/html)
function extractBodyFromPayload(payload: any): string {
  let text = '';
  if (!payload) return text;

  if (payload.body?.data) {
    try {
      const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      // strip html tags if any
      text += ' ' + decoded.replace(/<[^>]*>/g, ' ');
    } catch {
      // ignore
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      text += ' ' + extractBodyFromPayload(part);
    }
  }

  return text;
}

// Helper to extract text body or snippet and match numbers & merchants
function parseExpenseFromEmail(msgData: any): ExtractedEmailExpense | null {
  const headers = msgData.payload?.headers || [];
  const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject');
  const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from');
  const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date');

  const subject = subjectHeader?.value || 'Transacción';
  const from = fromHeader?.value || 'Desconocido';
  const snippet = msgData.snippet || '';

  // Extract body text from all parts recursively
  const extractedText = extractBodyFromPayload(msgData.payload);
  const fullText = `${subject} ${snippet} ${extractedText}`.replace(/\s+/g, ' ');

  // Look for currency amounts like $45.000, $ 120.000, COP 120,000, $ 18.500, USD 29.99, etc.
  // Specialized Bancolombia formats: "Bancolombia le informa compra por $35.000 en EXITO", "Debito de su cuenta por $50.000"
  const amountPatterns = [
    /(?:compra por|por valor de|debito por|débito por|pago por|valor|monto|total|pagaste)\s*[:$]?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)/i,
    /(?:COP|\$)\s*([0-9]{1,3}(?:[.,][0-9]{3})+)/i,
    /(?:COP|\$)\s*([0-9]+(?:[.,][0-9]{3})*)/i,
    /([0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:COP|pesos)/i,
    /(?:USD|US\$|\$)\s*([0-9]+(?:\.[0-9]{2})?)/i,
    /\$\s*([0-9]+)/i
  ];

  let detectedAmount = 0;
  for (const pat of amountPatterns) {
    const match = fullText.match(pat);
    if (match && match[1]) {
      const cleanNumStr = match[1].replace(/[.,](?=[0-9]{3}(?:[.,]|$))/g, '').replace(',', '.');
      const num = parseFloat(cleanNumStr);
      if (!isNaN(num) && num >= 500 && num < 100000000) {
        detectedAmount = Math.round(num);
        break;
      }
    }
  }

  // Fallback: look for general number sequences near Bancolombia keywords
  if (detectedAmount <= 0) {
    const fallbackMatch = fullText.match(/(?:debito|débito|crédito|transacción|pago|compra|bancolombia)[^0-9]{1,35}\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+)/i);
    if (fallbackMatch && fallbackMatch[1]) {
      const clean = fallbackMatch[1].replace(/[.,](?=[0-9]{3}(?:[.,]|$))/g, '').replace(',', '.');
      const num = parseFloat(clean);
      if (!isNaN(num) && num >= 500) {
        detectedAmount = Math.round(num);
      }
    }
  }

  // If still no amount found, skip this email
  if (detectedAmount <= 0) {
    return null;
  }

  // Determine merchant / entity with Bancolombia and PSE accuracy
  let merchant = 'Bancolombia (Compra)';
  
  if (/serviciopse|achcolombia|pse/i.test(from) || /servicio de pagos pse|comprobante pse/i.test(fullText)) {
    const pseMerchantMatch = fullText.match(/(?:empresa|comercio|recaudador|a favor de|pagado a|convenio)\s*[:]?\s*([A-Za-z0-9\s&.-]{3,35}?)(?:\s+(?:por valor|valor|referencia|fecha|estado|código|\.))/i)
      || fullText.match(/(?:en|empresa|comercio)\s+([A-Za-z0-9\s&.-]{3,25})/i);
    merchant = pseMerchantMatch ? `PSE - ${pseMerchantMatch[1].trim()}` : 'Pago PSE (ACH Colombia)';
  } else if (/bancolombia/i.test(from) || /notificacionesbancolombia/i.test(from) || /bancolombia/i.test(fullText)) {
    // Look for "en ESTABLECIMIENTO" pattern in Bancolombia alerts
    const inMatch = fullText.match(/(?:en|establecimiento|comercio|a|para)\s+([A-Za-z0-9\s&.-]{3,30}?)(?:\s+(?:el|con|desde|desde la|fecha|hora|por valor|tarjeta|\.))/i)
      || fullText.match(/(?:en|establecimiento)\s+([A-Za-z0-9\s&.-]{3,25})/i);
    
    if (inMatch && inMatch[1] && !/cuenta|tarjeta|bancolombia|sucursal/i.test(inMatch[1])) {
      merchant = inMatch[1].trim();
    } else if (/transferencia/i.test(fullText)) {
      merchant = 'Bancolombia (Transferencia)';
    } else if (/pse/i.test(fullText)) {
      merchant = 'Bancolombia (Pago PSE)';
    } else {
      merchant = 'Bancolombia (Transacción)';
    }
  } else if (/nequi/i.test(from) || /nequi/i.test(fullText)) {
    const nequiMatch = fullText.match(/(?:a|para|en)\s+([A-Za-z0-9\s&.-]{3,25})/i);
    merchant = nequiMatch ? `Nequi (${nequiMatch[1].trim()})` : 'Nequi (Pago)';
  } else if (/nu |nubank/i.test(from) || /nu |nubank/i.test(fullText)) {
    const nuMatch = fullText.match(/(?:en|comercio)\s+([A-Za-z0-9\s&.-]{3,25})/i);
    merchant = nuMatch ? `Nu (${nuMatch[1].trim()})` : 'Nu Bank (Tarjeta)';
  } else if (/davivienda/i.test(from) || /daviplata/i.test(fullText)) {
    merchant = 'Davivienda / Daviplata';
  } else if (/falabella/i.test(from) || /falabella/i.test(fullText)) {
    merchant = 'Banco Falabella / CMR';
  } else if (/rappi/i.test(from) || /rappi/i.test(fullText)) {
    merchant = 'Rappi';
  } else if (/uber/i.test(from) || /uber/i.test(fullText)) {
    merchant = 'Uber / DiDi';
  } else if (/d1/i.test(fullText)) {
    merchant = 'Tiendas D1';
  } else if (/ara/i.test(fullText)) {
    merchant = 'Tiendas Ara';
  } else if (/éxito|exito/i.test(fullText)) {
    merchant = 'Almacenes Éxito';
  } else if (/amazon/i.test(from) || /amazon/i.test(fullText)) {
    merchant = 'Amazon';
  } else if (/mercadolibre|mercado libre|mercadopago/i.test(fullText)) {
    merchant = 'Mercado Libre / Pago';
  } else if (/apple/i.test(from)) {
    merchant = 'Apple Services';
  } else if (/google/i.test(from)) {
    merchant = 'Google Play / Cloud';
  } else if (/spotify/i.test(from) || /spotify/i.test(fullText)) {
    merchant = 'Spotify';
  } else if (/netflix/i.test(from) || /netflix/i.test(fullText)) {
    merchant = 'Netflix';
  } else {
    // Clean from header name
    const senderName = from.split('<')[0].replace(/"/g, '').trim();
    merchant = senderName || subject.slice(0, 25) || 'Comercio / Notificación';
  }

  // Guess Category
  let suggestedCategory: MonthlyExtraExpenseCategory = 'salidas_ocio';
  let categoryLabel = 'Salidas & Restaurantes';

  const lowerText = fullText.toLowerCase();
  if (/rappi|restaurante|cafe|café|comida|panaderia|almuerzo|cena|pizza|burger|mcdonalds|starbucks/i.test(lowerText)) {
    suggestedCategory = 'salidas_ocio';
    categoryLabel = 'Salidas & Restaurantes';
  } else if (/uber|didi|gasolina|peaje|estacionamiento|parqueadero|terpel|primax|texaco/i.test(lowerText)) {
    suggestedCategory = 'transporte_extra';
    categoryLabel = 'Transporte Extra';
  } else if (/d1|exito|éxito|jumbo|olimpica|carulla|euro|mercado|supermercado|ara/i.test(lowerText)) {
    suggestedCategory = 'salidas_ocio';
    categoryLabel = 'Mercado / Salidas';
  } else if (/farmacia|drogueria|droguería|cruz verde|pasteur|salud|medicina|dr|odontolog/i.test(lowerText)) {
    suggestedCategory = 'salud_farmacia';
    categoryLabel = 'Salud & Farmacia';
  } else if (/zara|hm|falabella|koaj|arturo calle|ropa|calzado|adidas|nike/i.test(lowerText)) {
    suggestedCategory = 'compras_ropa';
    categoryLabel = 'Ropa & Compras';
  } else if (/tecnologia|apple|amazon|alkosto|ktronix|steam|playstation|mercadolibre/i.test(lowerText)) {
    suggestedCategory = 'tecnologia_hogar';
    categoryLabel = 'Tecnología & Gadgets';
  } else if (/veterinaria|pet|mascota|puppis/i.test(lowerText)) {
    suggestedCategory = 'mascotas_extra';
    categoryLabel = 'Mascotas';
  } else if (/homecenter|easy|ferreteria|reparacion/i.test(lowerText)) {
    suggestedCategory = 'imprevisto_hogar';
    categoryLabel = 'Imprevisto Hogar';
  } else {
    suggestedCategory = 'otro';
    categoryLabel = 'Otros Gastos';
  }

  // Parse Date
  let expenseDate = new Date().toISOString().split('T')[0];
  if (dateHeader?.value) {
    try {
      const parsedD = new Date(dateHeader.value);
      if (!isNaN(parsedD.getTime())) {
        expenseDate = parsedD.toISOString().split('T')[0];
      }
    } catch {
      // fallback to today
    }
  }

  return {
    id: `gmail-${msgData.id}`,
    messageId: msgData.id,
    sender: from,
    subject: subject,
    date: expenseDate,
    merchant: merchant,
    amount: detectedAmount,
    currency: 'COP',
    suggestedCategory,
    categoryLabel,
    confidence: 0.9,
    snippet: snippet || subject,
    paymentMethod: /tarjeta|credito|crédito/i.test(fullText) ? 'Tarjeta de Crédito' : 'Transferencia / PSE'
  };
}
