export function BrandMark({ size = 28, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path
        d="M8.8 8.8h14.4v11.4h-7.5L11.4 23.4v-3.2H8.8V8.8Z"
        fill="#FFFFFF"
      />
      <path
        d="M16.6 12.1h1.8a3.1 3.1 0 0 1 0 6.2h-1.8v-6.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({ href = "/", className = "", subtitle = "" }) {
  return (
    <a
      className={`brand-lockup ${className}`.trim()}
      href={href}
      aria-label="Dessoir Ai home"
    >
      <BrandMark size={28} className="brand-lockup-mark" />
      <span className="brand-lockup-copy">
        <strong>Dessoir Ai</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
    </a>
  );
}

const PETALS = [0, 60, 120, 180, 240, 300];

export function FlowerMark({ size = 32, className = "", dotted = false }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <g fill="currentColor" stroke="#FFFFFF" strokeWidth="1.6">
        {PETALS.map((angle) => (
          <path
            key={angle}
            d="M32 5.4c7.2 8.9 7.2 17.3 0 27.1-7.2-9.8-7.2-18.2 0-27.1Z"
            transform={`rotate(${angle} 32 32)`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r={dotted ? 4.4 : 3.6} fill="#FFFFFF" />
    </svg>
  );
}

const DIAMOND = "M8 0.6 11.2 4.8 8 9 4.8 4.8Z";

export function ProgressDiamonds({ filled = 0, total = 8, label }) {
  return (
    <span
      className="progress-diamonds"
      role="img"
      aria-label={label || `Step ${filled} of ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => (
        <svg
          key={index}
          width="12"
          height="10"
          viewBox="0 0 16 10"
          aria-hidden="true"
          data-filled={index < filled ? "true" : "false"}
        >
          <path d={DIAMOND} fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

const CLUSTER = [
  [0, 0],
  [58, 0],
  [29, 44],
  [0, 88],
  [58, 88],
  [29, 132],
  [0, 176],
  [58, 176]
];

export function DiamondPattern({ className = "", id }) {
  return (
    <svg
      className={`diamond-pattern ${className}`.trim()}
      viewBox="0 0 120 230"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#E7E7EC" strokeWidth="1.2">
        {CLUSTER.map(([x, y], index) => (
          <g key={`${id || "d"}-${index}`} transform={`translate(${x} ${y})`}>
            <rect
              x="17"
              y="17"
              width="42"
              height="42"
              rx="7"
              transform="rotate(45 38 38)"
            />
            {index % 4 === 0 ? <circle cx="38" cy="38" r="1.7" fill="#E7E7EC" stroke="none" /> : null}
          </g>
        ))}
      </g>
    </svg>
  );
}
