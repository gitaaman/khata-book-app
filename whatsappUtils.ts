import type { ShopProfile, Customer, Bill } from './database.types';

export const DEFAULT_WHATSAPP_TEMPLATE = `🛒 *{shopName}*
👤 ग्राहक: *{customerName}*
📄 खाता / रसीद नं: {accountUid}
📅 तारीख: {todayDate}

💰 *कुल देय राशि: ₹{totalAmount}*
{upiSection}
_धन्यवाद, पुनः पधारें!_`;

export const formatWhatsAppBillMessage = (
  shop: ShopProfile,
  customer: Customer,
  bill?: Bill | null,
  billsList?: Bill[],
  customTemplate?: string
): string => {
  const template = customTemplate || shop.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;

  const shopName = shop.shopName || 'खाता बुक';
  const customerName = customer.name;

  // Customer Special UID (Clean, professional unique ID)
  const cleanCustUid = customer.id.length > 8
    ? `KB-${customer.id.slice(-6).toUpperCase()}`
    : customer.id;

  const accountUid = bill
    ? `${bill.billNumber} (${cleanCustUid})`
    : cleanCustUid;

  // Date of sending (जिस दिन भेजा उस दिन की तारीख - DD/MM/YYYY)
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const todayDate = `${day}-${month}-${year}`;

  // Amount calculation
  let totalAmount = 0;
  if (bill) {
    totalAmount = bill.totalAmount;
  } else if (Array.isArray(billsList) && billsList.length > 0) {
    billsList.forEach((b) => { totalAmount += b.totalAmount; });
  } else {
    totalAmount = customer.runningBalance > 0 ? customer.runningBalance : Math.abs(customer.runningBalance);
  }

  const upiSection = shop.upiId
    ? `⚡ GooglePay/PhonePe/Paytm से भुगतान हेतु UPI ID: *${shop.upiId}*\n`
    : '';

  return template
    .replace('{shopName}', shopName)
    .replace('{customerName}', customerName)
    .replace('{accountUid}', accountUid)
    .replace('{todayDate}', todayDate)
    .replace('{totalAmount}', totalAmount.toFixed(2))
    .replace('{upiSection}', upiSection)
    .replace('{balance}', Math.abs(customer.runningBalance).toFixed(2));
};

export const openWhatsApp = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const encoded = encodeURIComponent(message);
  const url = cleanPhone.length === 10
    ? `https://wa.me/91${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
};
