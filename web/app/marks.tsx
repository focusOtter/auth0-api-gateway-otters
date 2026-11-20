type MarkProps = { kind?: 'otter' | 'shell' | 'reed'; className?: string };

export function RiverMark({ kind = 'otter', className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 120 120" width="1em" height="1em" fill="none" aria-hidden="true" focusable="false">
      {kind === 'otter' ? <>
        <path d="M72 82c25 0 33 14 25 22-8 7-28-2-36-12" fill="#76513c" stroke="#183e36" strokeWidth="3" />
        <ellipse cx="60" cy="72" rx="28" ry="34" fill="#946747" stroke="#183e36" strokeWidth="3" />
        <ellipse cx="60" cy="72" rx="18" ry="25" fill="#e9cf9d" />
        <circle cx="35" cy="27" r="11" fill="#946747" stroke="#183e36" strokeWidth="3" />
        <circle cx="85" cy="27" r="11" fill="#946747" stroke="#183e36" strokeWidth="3" />
        <ellipse cx="60" cy="38" rx="30" ry="25" fill="#946747" stroke="#183e36" strokeWidth="3" />
        <ellipse cx="60" cy="46" rx="22" ry="13" fill="#f3dfb6" />
        <circle cx="48" cy="34" r="3" fill="#183e36" /><circle cx="72" cy="34" r="3" fill="#183e36" />
        <path d="m55 42 5 5 5-5Z" fill="#183e36" />
        <path d="M60 47v5m-5 0q5 5 10 0M40 46l-13-3m13 8-14 3m54-8 13-3m-13 8 14 3" stroke="#183e36" strokeWidth="2" strokeLinecap="round" />
        <path d="M35 66q10 18 25 10 15 8 25-10M44 100l-7 8m39-8 7 8" stroke="#183e36" strokeWidth="5" strokeLinecap="round" />
        <path d="m53 72 7-7 7 7-7 8Z" fill="#d67742" stroke="#183e36" strokeWidth="2" />
      </> : kind === 'shell' ? <>
        <path d="M26 80C-3 24 32 10 42 29 50 3 73 3 80 29c18-17 46 2 16 51L70 103H50Z" fill="#e9cf9d" stroke="#183e36" strokeWidth="4" />
        <path d="m24 43 29 48M44 28l14 62m21-62L65 90m32-47L70 91M45 103h30" stroke="#946747" strokeWidth="3" strokeLinecap="round" />
      </> : <>
        <path d="M60 110V14m0 64C18 77 9 47 13 34c32 0 47 22 47 44Zm0-24C99 55 111 25 107 13 77 13 60 33 60 54Z" fill="#64834c" stroke="#183e36" strokeWidth="3" strokeLinejoin="round" />
      </>}
    </svg>
  );
}
