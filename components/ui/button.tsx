// Each variant sets its own colors; the base has none, so classes never fight over a property.
const base =
  'cursor-pointer rounded-[10px] border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50';

const variants = {
  secondary: 'border-slate-200 bg-white text-slate-900 enabled:hover:border-slate-500 focus-visible:outline-indigo-600',
  primary: 'border-indigo-600 bg-indigo-600 text-white enabled:hover:border-indigo-700 enabled:hover:bg-indigo-700 focus-visible:outline-indigo-600',
  danger: 'border-red-600 bg-red-600 text-white enabled:hover:border-red-700 enabled:hover:bg-red-700 focus-visible:outline-red-600',
  'danger-outline': 'border-slate-200 bg-white text-slate-900 enabled:hover:border-red-600 enabled:hover:text-red-600 focus-visible:outline-red-600',
};

type Props = React.ComponentProps<'button'> & { variant?: keyof typeof variants };

export function Button({ variant = 'secondary', type = 'button', className = '', ...props }: Props) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
