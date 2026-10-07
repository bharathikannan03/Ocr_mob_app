import { Contact } from '../types';

export function exportContactsToCsv(contacts: Contact[]) {
  const headers = [
    'Name',
    'Designation',
    'Company',
    'Email',
    'Phone',
    'Website',
    'Address',
    'City',
    'State',
    'Country',
    'LinkedIn',
    'Notes',
    'Source',
    'Created At',
  ];

  const escapeCell = (val: string | undefined | null) => {
    if (!val) return '""';
    const clean = val.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = contacts.map((c) => [
    escapeCell(c.name),
    escapeCell(c.designation),
    escapeCell(c.company),
    escapeCell(c.email),
    escapeCell(c.phone),
    escapeCell(c.website),
    escapeCell(c.address),
    escapeCell(c.city),
    escapeCell(c.state),
    escapeCell(c.country),
    escapeCell(c.linkedin),
    escapeCell(c.notes),
    escapeCell(c.source),
    escapeCell(c.createdAt),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
