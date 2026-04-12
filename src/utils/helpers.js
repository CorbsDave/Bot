import { format, formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';

export const formatCurrency = (amount) =>
  `€${Number(amount).toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatTime = (date) => format(new Date(date), 'HH:mm');
export const formatDate = (date) => format(new Date(date), 'dd/MM/yyyy');
export const formatDateTime = (date) => format(new Date(date), 'dd/MM/yyyy HH:mm');
export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const elapsedMinutes = (startTime) =>
  differenceInMinutes(new Date(), new Date(startTime));

export const elapsedHours = (startTime) =>
  differenceInHours(new Date(), new Date(startTime));

export const formatElapsed = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const tierColour = (tier) => {
  switch (tier) {
    case 'Champion': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: '#F5A623' };
    case 'Loyal': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: '#0EA5E9' };
    case 'Regular': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: '#22C55E' };
    case 'At Risk': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: '#EF4444' };
    case 'Lapsed': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: '#64748B' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: '#64748B' };
  }
};

export const statusColour = (status) => {
  switch (status) {
    case 'In progress': return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'Awaiting parts': return { bg: 'bg-amber-100', text: 'text-amber-800' };
    case 'VOR': return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'Complete': return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'Invoiced': return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
    case 'Diagnostic': return { bg: 'bg-purple-100', text: 'text-purple-800' };
    case 'Free': return { bg: 'bg-gray-100', text: 'text-gray-600' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
};

export const vorStatusColour = (status) => {
  switch (status) {
    case 'ESCALATED': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' };
    case 'DELAYED': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-400' };
    case 'WAITING': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' };
    case 'RESOLVED': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
  }
};

export const getInitials = (name) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const avatarColour = (name) => {
  const colours = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
    'bg-red-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colours[hash % colours.length];
};

export const scoreColour = (score) => {
  if (score >= 80) return 'text-amber-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-green-500';
  return 'text-red-500';
};

export const scoreBarColour = (score) => {
  if (score >= 80) return 'bg-amber-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-green-500';
  return 'bg-red-500';
};
