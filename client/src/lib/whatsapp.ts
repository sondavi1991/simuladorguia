export function openWhatsApp(message?: string) {
  // Use environment variable for WhatsApp number or fallback
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "5511999999999"; // Replace with actual number
  
  const defaultMessage = message || "Olá! Gostaria de saber mais sobre os planos de saúde recomendados pelo simulador.";
  
  const encodedMessage = encodeURIComponent(defaultMessage);
  const url = `https://wa.me/${phone}?text=${encodedMessage}`;
  
  // Open WhatsApp in a new window/tab
  window.open(url, '_blank');
}
