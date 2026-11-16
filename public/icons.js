// 선형 아이콘 세트 (24×24, 선 굵기 1.6) — 구역·루트·유형 표시에 사용
const P = {
  camp: '<path d="M3 20h18"/><path d="M12 4 4 20"/><path d="M12 4l8 16"/><path d="M9.5 20 12 14.5 14.5 20"/><path d="M10.5 4.5 12 4l1.5.5"/>',
  ridge: '<path d="M2 19 8.5 8l4 6.5 3-4.5L22 19z"/><path d="M8.5 8 10 10.6"/><path d="M5 16c2 0 3 1.4 5 1.4s3-1.4 5-1.4"/>',
  river: '<path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  flag: '<path d="M5 21V3.5"/><path d="M5 4h12.5l-2.5 4.25L17.5 12.5H5"/>',
  log: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 7.5h6M9 11h4"/>',
  settle: '<path d="M2.5 21h19"/><path d="M4.5 21v-9l4.5-3.5 4.5 3.5v9"/><path d="M13.5 21v-6l3.5-2.5 3 2.2V21"/><path d="M8 21v-4h2v4"/><path d="M17 5v2.5M15.8 6.2h2.4"/>',
  scout: '<path d="M3.5 14.5 14 8.5l2 3.6-10.5 6z"/><path d="M14 8.5l3-1.7 2 3.6-3 1.7"/><path d="M9 16.5 7 21M11 15.3 13 21"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  spark: '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/><path d="M19 17.5v3M17.5 19h3"/>',
  finish: '<path d="M6 21V4"/><path d="M6 4h12v8H6"/><path d="M10 4v8M14 4v8M6 8h12"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  arrow: '<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
};
export function icon(name, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.compass}</svg>`;
}
