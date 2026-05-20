/**
 * Logo component - dùng cho sidebar, login, splash
 * 
 * variant:
 *  - 'icon'        : chỉ symbol F (cho sidebar mobile compact)
 *  - 'with-text'   : symbol + chữ FinFlow đứng (cho login page)
 *  - 'horizontal'  : symbol nhỏ + chữ ngang (cho sidebar/topbar - mặc định)
 */
export default function Logo({ size = 32, variant = 'horizontal', className = '' }) {
  const BASE = import.meta.env.BASE_URL || '/';

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img
          src={`${BASE}logo-symbol.png`}
          alt="FinFlow"
          style={{ height: size, width: 'auto' }}
        />
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Fin<span className="text-blue-600 dark:text-blue-400">Flow</span>
        </span>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <img
        src={`${BASE}logo-symbol.png`}
        alt="FinFlow"
        className={className}
        style={{ height: size, width: 'auto' }}
      />
    );
  }

  if (variant === 'with-text') {
    return (
      <img
        src={`${BASE}logo-with-text.png`}
        alt="FinFlow"
        className={className}
        style={{ height: size, width: 'auto' }}
      />
    );
  }

  return null;
}
