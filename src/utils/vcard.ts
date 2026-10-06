import { Contact } from '../types';

export function generateVCard(contact: Contact): string {
  const parts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name}`,
    `N:${contact.name.split(' ').reverse().join(';')};;;`,
  ];

  if (contact.company) parts.push(`ORG:${contact.company}`);
  if (contact.designation) parts.push(`TITLE:${contact.designation}`);
  if (contact.email) parts.push(`EMAIL;type=INTERNET;type=WORK:${contact.email}`);
  if (contact.phone) parts.push(`TEL;type=CELL;type=VOICE:${contact.phone}`);
  if (contact.website) parts.push(`URL:${contact.website}`);
  if (contact.address) {
    parts.push(
      `ADR;type=WORK:;;${contact.address};${contact.city};${contact.state};;${contact.country}`
    );
  }
  if (contact.notes) parts.push(`NOTE:${contact.notes}`);
  if (contact.linkedin) parts.push(`X-SOCIALPROFILE;type=linkedin:${contact.linkedin}`);

  parts.push('END:VCARD');
  return parts.join('\r\n');
}

export function downloadVCard(contact: Contact) {
  const vcardContent = generateVCard(contact);
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${contact.name.replace(/\s+/g, '_')}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
