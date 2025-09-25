// /components/WhatsAppChatWidget.jsx
'use client';
import { useEffect, useState } from 'react';


export default function WhatsAppChatWidget() {
const [open, setOpen] = useState(false);
const [config, setConfig] = useState({ phone_e164: '', default_message: '' });
const [message, setMessage] = useState('');


useEffect(() => {
const load = async () => {
try {
const res = await fetch('/api/whatsapp-config', { cache: 'no-store' });
const data = await res.json();
setConfig({
phone_e164: data?.phone_e164 || '',
default_message: data?.default_message || '',
});
} catch (e) { /* noop */ }
};
load();
}, []);


const phoneDigits = config.phone_e164?.replace(/\D/g, '') || '';
const text = (message || config.default_message || '').trim();
const href = `https://wa.me/${phoneDigits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;


return (
<div className="fixed bottom-6 right-6 z-50">
{open && (
<div className="mb-2 w-72 rounded-2xl shadow-lg border border-[#7B2710] bg-[#F5F1F1] p-3">
<div className="text-sm text-[#7B2710] font-medium mb-2">Enviar mensaje por WhatsApp</div>
<textarea
className="w-full rounded-xl border border-[#7B2710] p-2 text-sm focus:outline-none"
rows={3}
placeholder={config.default_message || 'Escribe tu mensaje...'}
value={message}
onChange={(e) => setMessage(e.target.value)}
/>
<a
href={href}
target="_blank"
rel="noopener noreferrer"
className="mt-2 inline-flex items-center justify-center w-full rounded-xl border border-[#8C9560] px-3 py-2 text-sm hover:bg-[#8C9560]"
>
Abrir en WhatsApp
</a>
</div>
)}


<button
  id="whatsapp-widget-btn"
  onClick={() => setOpen((v) => !v)}
  aria-label="Abrir chat de WhatsApp"
  className="h-14 w-14 rounded-full shadow-xl bg-green-500 text-white flex items-center justify-center text-xl"
>
  {open ? '×' : '💬'}
</button>
</div>
);
}