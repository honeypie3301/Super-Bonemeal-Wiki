import React, { useId } from 'react';

export type MacOsCursorVariant = 'default' | 'pointer' | 'text';

export type CursorStyleId =
  | 'macos'
  | 'prismatic'
  | 'chroma-cur'
  | 'backwoods-shard'
  | 'archival-nib'
  | 'crisp-pixel';

export interface CursorPackMeta {
  id: CursorStyleId;
  name: string;
  badge: string;
  description: string;
  shapeRendering: 'geometricPrecision' | 'crispEdges';
}

export const CURSOR_PACKS: CursorPackMeta[] = [
  {
    id: 'macos',
    name: 'macOS',
    badge: 'Default',
    description: 'Clean white-rimmed pointer, 3-crease glove & forked-serif I-beam.',
    shapeRendering: 'geometricPrecision',
  },
  {
    id: 'prismatic',
    name: 'Prismatic Halo',
    badge: 'PNG → SVG',
    description: 'Vibrant rainbow-outlined white arrow, pointing hand & matching I-beam.',
    shapeRendering: 'geometricPrecision',
  },
  {
    id: 'chroma-cur',
    name: 'Tri-Tone Minimal',
    badge: '.CUR → SVG',
    description: 'Sky arrow, coral-crimson serif I-beam & copper wireframe hand.',
    shapeRendering: 'geometricPrecision',
  },
  {
    id: 'backwoods-shard',
    name: 'Backwoods Shard',
    badge: 'Custom SVG',
    description: 'Obsidian blade pointer, emerald-bevel gauntlet & tactical reticle.',
    shapeRendering: 'geometricPrecision',
  },
  {
    id: 'archival-nib',
    name: 'Archival Brass Nib',
    badge: 'Custom SVG',
    description: 'Calligraphy fountain nib, inked pointing glove & brass drafting caliper.',
    shapeRendering: 'geometricPrecision',
  },
  {
    id: 'crisp-pixel',
    name: 'Razor Pixel',
    badge: 'Crisp Grid',
    description: 'Zero-blur integer-snapped pixel arrow, glove & orthogonal I-beam.',
    shapeRendering: 'crispEdges',
  },
];

const VALID_STYLE_SET = new Set<string>(CURSOR_PACKS.map((p) => p.id));

export function normalizeCursorStyle(value: unknown): CursorStyleId {
  if (typeof value === 'string' && VALID_STYLE_SET.has(value)) {
    return value as CursorStyleId;
  }
  return 'macos';
}

export function getCursorPackMeta(style: CursorStyleId): CursorPackMeta {
  return CURSOR_PACKS.find((p) => p.id === style) || CURSOR_PACKS[0];
}

interface MacOsCursorSvgProps {
  className?: string;
  size?: number;
  variant?: MacOsCursorVariant;
  style?: CursorStyleId;
}

// 1. macOS Sequoia paths
const MACOS_ARROW_PATH =
  'M2.9 3.55L2.9 17.85L6.15 14.6L9.4 21.75L11.35 20.8L9.08 14.28L12.98 13.63L2.9 3.55Z';
const MACOS_HAND_PATH =
  'M8.1 3.5C8.0 1.8 10.9 1.6 11.2 3.3L12.1 9.5C12.5 8.1 14.9 8.2 15.1 9.9L15.2 10.4C15.6 9.1 17.9 9.4 18.0 11.0L18.0 11.6C18.4 10.4 20.5 10.8 20.5 12.4L20.4 15.1C20.3 19.0 17.7 21.8 13.9 22.0C10.3 22.1 7.9 19.8 6.4 16.9L4.3 13.5C3.1 11.7 4.9 10.0 6.4 11.2L8.9 13.4L8.1 3.5Z';
const MACOS_CREASES_PATH =
  'M11.1 14.6L11.5 18.8M13.8 14.7L13.9 18.9M16.4 14.5L16.2 18.6';
const MACOS_IBEAM_PATH =
  'M4.1 2.7Q6.4 3.1 7.0 5.1L7.0 19.3Q6.4 21.3 4.1 21.7M9.9 2.7Q7.6 3.1 7.0 5.1L7.0 19.3Q7.6 21.3 9.9 21.7';

// 2. Prismatic Halo paths (converted from ArrowFarCursor.png + ArrowCursor.png)
const PRISMATIC_ARROW_PATH =
  'M3.2 2.7L3.2 18.5L7.1 15.0L9.9 21.7L12.3 20.7L9.5 14.0L14.8 13.4Z';
const PRISMATIC_HAND_PATH =
  'M7.9 3.6C7.9 2.0 10.9 2.0 10.9 3.6L10.9 10.1C11.4 8.7 13.8 8.7 13.9 10.2L13.9 10.8C14.4 9.4 16.6 9.5 16.7 11.0L16.7 11.7C17.2 10.4 19.3 10.7 19.3 12.2L19.2 15.7C19.1 18.4 18.4 20.6 17.6 21.7L9.4 21.7C7.7 19.5 5.4 16.3 3.9 13.4C3.1 11.8 4.8 10.1 6.3 11.3L7.9 12.7Z';
const PRISMATIC_IBEAM_PATH =
  'M3.8 2.9Q6.3 3.3 7.0 5.4L7.0 19.4Q6.3 21.5 3.8 21.9M10.2 2.9Q7.7 3.3 7.0 5.4L7.0 19.4Q7.7 21.5 10.2 21.9';

// 3. Tri-Tone Minimal paths (converted from 01_normal_select (1).cur, 02_Text_Select.cur, 03_link_select.cur)
const CUR_BLUE_ARROW_PATH =
  'M2.9 2.7L2.9 19.3L6.5 15.6L9.3 22.3L11.7 21.2L8.9 14.3L14.8 13.7Z';
const CUR_BLUE_HIGHLIGHT =
  'M3.7 4.7L3.7 16.9L6.5 14.1';
const CUR_RED_IBEAM_PATH =
  'M2.6 3.0L11.4 3.0L11.4 5.3Q8.4 5.7 8.1 9.0L8.1 16.0Q8.4 19.3 11.4 19.7L11.4 22.0L2.6 22.0L2.6 19.7Q5.6 19.3 5.9 16.0L5.9 9.0Q5.6 5.7 2.6 5.3Z';
const CUR_AMBER_HAND_PATH =
  'M9.3 3.4C9.3 1.9 11.8 1.9 11.8 3.4L11.8 9.6C12.4 8.2 14.7 8.3 14.8 9.9L14.8 10.6C15.4 9.2 17.6 9.5 17.7 11.0L17.7 11.8C18.2 10.6 20.2 10.9 20.2 12.4L19.6 17.9L18.5 22.0L10.2 22.0L7.6 17.6L4.1 13.8C2.9 12.4 4.3 10.5 6.0 11.5L9.3 13.8Z';

// 4. Backwoods Shard paths
const SHARD_ARROW_PATH =
  'M2.8 2.5L14.8 12.1L9.6 13.4L12.3 20.7L9.8 21.9L6.9 14.7L2.8 18.2Z';
const SHARD_SPINE_PATH =
  'M3.5 4.2L8.2 13.3L10.6 20.5';
const SHARD_HAND_PATH =
  'M8.3 3.4L9.5 2.0L10.7 3.4L11.2 9.4L12.6 8.1L14.0 9.4L14.2 10.4L15.6 9.1L17.0 10.4L17.2 11.4L18.5 10.3L19.9 11.6L19.6 16.5L16.8 21.8L10.0 21.8L6.2 16.9L3.5 12.5L5.2 10.8L8.4 13.0Z';
const SHARD_IBEAM_PATH =
  'M3.3 3.1L7.0 5.6L10.7 3.1M3.3 21.9L7.0 19.4L10.7 21.9M7.0 5.6L7.0 19.4';

// 5. Archival Brass Nib paths
const NIB_ARROW_PATH =
  'M2.8 2.6L13.1 7.7L12.2 12.1L15.1 15.0L11.9 18.2L9.0 15.3L4.6 16.2Z';
const NIB_COLLAR_PATH =
  'M11.6 12.6L14.6 15.6M9.6 14.6L12.6 17.6';
const NIB_SLIT_PATH =
  'M2.9 2.7L8.4 8.2';
const NIB_HAND_PATH =
  'M8.2 3.3C8.2 1.8 10.8 1.8 10.9 3.3L11.4 9.5C12.0 8.2 14.2 8.3 14.3 9.9L14.4 10.5C15.0 9.3 17.1 9.6 17.2 11.1L17.2 11.7C17.8 10.6 19.7 11.0 19.7 12.5L19.5 16.2L17.6 21.5L9.8 21.5L6.8 17.3L4.0 13.4C2.9 11.9 4.5 10.1 6.2 11.3L8.5 13.3Z';
const NIB_IBEAM_PATH =
  'M3.6 3.0L7.0 5.0L10.4 3.0M3.6 22.0L7.0 20.0L10.4 22.0M7.0 5.0L7.0 20.0M5.2 12.5L8.8 12.5';

// 6. Razor Pixel paths (exact integer grid for crispEdges)
const PIXEL_ARROW_FILL =
  'M3 3H4V4H5V5H6V6H7V7H8V8H9V9H10V10H11V11H12V12H13V13H14V14H10V16H11V18H12V20H11V21H9V19H8V17H7V15H6V16H5V17H3Z';
const PIXEL_ARROW_OUTLINE =
  'M2 2H4V3H5V4H6V5H7V6H8V7H9V8H10V9H11V10H12V11H13V12H14V13H15V15H11V17H12V19H13V21H12V22H9V21H8V19H7V17H6V18H4V19H2V2ZM4 4V16H5V15H6V14H8V16H9V18H10V20H11V18H10V16H9V13H13V12H12V11H11V10H10V9H9V8H8V7H7V6H6V5H5V4H4Z';
const PIXEL_HAND_FILL =
  'M9 3H11V10H14V11H17V12H20V17H19V20H18V21H10V19H8V17H6V15H4V13H7V14H9Z';
const PIXEL_HAND_OUTLINE =
  'M8 2H12V9H15V10H18V11H21V18H20V21H19V22H9V20H7V18H5V16H3V12H7V13H8V2ZM9 3V14H7V13H4V15H6V17H8V19H10V21H18V20H19V17H20V12H17V11H14V10H11V3H9Z';
const PIXEL_IBEAM_OUTER =
  'M2 2H6V3H8V2H12V5H8V20H12V23H8V22H6V23H2V20H6V5H2Z';
const PIXEL_IBEAM_INNER =
  'M3 3H6V4H8V3H11V4H8V21H11V22H8V21H6V22H3V21H6V4H3Z';

function roundDec(val: number): number {
  return Math.round(val * 10) / 10;
}

export function clampCursorSize(size: number): number {
  if (!Number.isFinite(size)) return 16.5;
  return Math.max(5, Math.min(42, Math.round(size * 10) / 10));
}

export function getCursorDimensions(
  size = 16.5,
  variant: MacOsCursorVariant = 'default',
  style: CursorStyleId = 'macos'
) {
  const baseWidth = clampCursorSize(size);
  const height = Math.max(6.9, roundDec((baseWidth * 25) / 18));

  const hotspot =
    style === 'prismatic'
      ? { default: [3.2, 2.7], pointer: [9.4, 2.5], text: [7.0, 12.4] }
      : style === 'chroma-cur'
        ? { default: [2.9, 2.7], pointer: [10.5, 2.3], text: [7.0, 12.5] }
        : style === 'backwoods-shard'
          ? { default: [2.8, 2.5], pointer: [9.5, 2.2], text: [7.0, 12.5] }
          : style === 'archival-nib'
            ? { default: [2.8, 2.6], pointer: [9.5, 2.3], text: [7.0, 12.5] }
            : style === 'crisp-pixel'
              ? { default: [3.0, 3.0], pointer: [9.5, 2.5], text: [7.0, 12.5] }
              : { default: [2.9, 3.55], pointer: [9.6, 2.4], text: [7.0, 12.2] };

  if (variant === 'pointer') {
    const width = Math.max(6.6, roundDec((height * 24) / 25));
    const maxHx = Math.max(0, Math.floor(width) - 1);
    const maxHy = Math.max(0, Math.floor(height) - 1);
    const [tx, ty] = hotspot.pointer;
    return {
      width,
      height,
      viewBox: '0 0 24 25',
      hx: Math.max(0, Math.min(maxHx, Math.round((tx * width) / 24))),
      hy: Math.max(0, Math.min(maxHy, Math.round((ty * height) / 25))),
      tipOffsetX: -((tx * width) / 24),
      tipOffsetY: -((ty * height) / 25),
    };
  }

  if (variant === 'text') {
    const width = Math.max(3.9, roundDec((height * 14) / 25));
    const maxHx = Math.max(0, Math.floor(width) - 1);
    const maxHy = Math.max(0, Math.floor(height) - 1);
    const [tx, ty] = hotspot.text;
    return {
      width,
      height,
      viewBox: '0 0 14 25',
      hx: Math.max(0, Math.min(maxHx, Math.round((tx * width) / 14))),
      hy: Math.max(0, Math.min(maxHy, Math.round((ty * height) / 25))),
      tipOffsetX: -((tx * width) / 14),
      tipOffsetY: -((ty * height) / 25),
    };
  }

  const maxHx = Math.max(0, Math.floor(baseWidth) - 1);
  const maxHy = Math.max(0, Math.floor(height) - 1);
  const [tx, ty] = hotspot.default;
  return {
    width: baseWidth,
    height,
    viewBox: '0 0 18 25',
    hx: Math.max(0, Math.min(maxHx, Math.round((tx * baseWidth) / 18))),
    hy: Math.max(0, Math.min(maxHy, Math.round((ty * height) / 25))),
    tipOffsetX: -((tx * baseWidth) / 18),
    tipOffsetY: -((ty * height) / 25),
  };
}

function renderVariantSvgInner(
  variant: MacOsCursorVariant,
  style: CursorStyleId,
  gradId: string
): string {
  if (style === 'prismatic') {
    const gradDef =
      variant === 'pointer'
        ? `<defs><linearGradient id="${gradId}" x1="15%" y1="95%" x2="88%" y2="5%"><stop offset="0%" stop-color="#9EF01A"/><stop offset="32%" stop-color="#FFB800"/><stop offset="65%" stop-color="#FF4D1A"/><stop offset="100%" stop-color="#FF1493"/></linearGradient></defs>`
        : `<defs><linearGradient id="${gradId}" x1="5%" y1="25%" x2="85%" y2="95%"><stop offset="0%" stop-color="#FF1493"/><stop offset="38%" stop-color="#FF551A"/><stop offset="72%" stop-color="#FFB800"/><stop offset="100%" stop-color="#A3E635"/></linearGradient></defs>`;

    if (variant === 'pointer') {
      return [
        gradDef,
        `<path d="${PRISMATIC_HAND_PATH}" transform="translate(0.45, 0.8)" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.22)" stroke-width="2.35" stroke-linejoin="round" stroke-linecap="round"/>`,
        `<path d="${PRISMATIC_HAND_PATH}" fill="url(#${gradId})" stroke="url(#${gradId})" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>`,
        `<path d="${PRISMATIC_HAND_PATH}" fill="#FFFFFF"/>`,
      ].join('');
    }
    if (variant === 'text') {
      return [
        gradDef,
        `<path d="${PRISMATIC_IBEAM_PATH}" transform="translate(0.3, 0.65)" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="4.0" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<path d="${PRISMATIC_IBEAM_PATH}" fill="none" stroke="url(#${gradId})" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<path d="${PRISMATIC_IBEAM_PATH}" fill="none" stroke="#FFFFFF" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>`,
      ].join('');
    }
    return [
      gradDef,
      `<path d="${PRISMATIC_ARROW_PATH}" transform="translate(0.45, 0.75)" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.22)" stroke-width="2.45" stroke-linejoin="round" stroke-linecap="round"/>`,
      `<path d="${PRISMATIC_ARROW_PATH}" fill="url(#${gradId})" stroke="url(#${gradId})" stroke-width="2.35" stroke-linejoin="round" stroke-linecap="round"/>`,
      `<path d="${PRISMATIC_ARROW_PATH}" fill="#FFFFFF"/>`,
    ].join('');
  }

  if (style === 'chroma-cur') {
    if (variant === 'pointer') {
      return [
        `<path d="${CUR_AMBER_HAND_PATH}" transform="translate(0.4, 0.75)" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`,
        `<path d="${CUR_AMBER_HAND_PATH}" fill="rgba(255,248,238,0.16)" stroke="#451A03" stroke-width="2.35" stroke-linejoin="round" stroke-linecap="round"/>`,
        `<path d="${CUR_AMBER_HAND_PATH}" fill="none" stroke="#E2985C" stroke-width="1.55" stroke-linejoin="round" stroke-linecap="round"/>`,
      ].join('');
    }
    if (variant === 'text') {
      return [
        `<path d="${CUR_RED_IBEAM_PATH}" transform="translate(0.3, 0.6)" fill="rgba(0,0,0,0.2)" stroke="rgba(0,0,0,0.2)" stroke-width="1.35" stroke-linejoin="round"/>`,
        `<path d="${CUR_RED_IBEAM_PATH}" fill="#E05252" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/>`,
        `<path d="${CUR_RED_IBEAM_PATH}" fill="#E05252" stroke="#991B1B" stroke-width="0.45" stroke-linejoin="round"/>`,
        `<path d="M7.0 5.5L7.0 19.5" stroke="#FECACA" stroke-width="0.6" stroke-linecap="round"/>`,
      ].join('');
    }
    return [
      `<path d="${CUR_BLUE_ARROW_PATH}" transform="translate(0.35, 0.75)" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.22)" stroke-width="1.75" stroke-linejoin="round"/>`,
      `<path d="${CUR_BLUE_ARROW_PATH}" fill="#38BDF8" stroke="#075985" stroke-width="1.45" stroke-linejoin="round"/>`,
      `<path d="${CUR_BLUE_HIGHLIGHT}" fill="none" stroke="#BAE6FD" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/>`,
    ].join('');
  }

  if (style === 'backwoods-shard') {
    if (variant === 'pointer') {
      return [
        `<path d="${SHARD_HAND_PATH}" transform="translate(0.35, 0.8)" fill="rgba(0,0,0,0.25)" stroke="rgba(0,0,0,0.25)" stroke-width="2.1" stroke-linejoin="miter"/>`,
        `<path d="${SHARD_HAND_PATH}" fill="#0B1310" stroke="#FFFFFF" stroke-width="1.95" stroke-linejoin="miter"/>`,
        `<path d="${SHARD_HAND_PATH}" fill="#0B1310" stroke="#34D399" stroke-width="1.05" stroke-linejoin="miter"/>`,
        `<path d="M12.2 14.4L13.7 12.9L15.2 14.4L13.7 15.9Z" fill="#34D399"/>`,
      ].join('');
    }
    if (variant === 'text') {
      return [
        `<path d="${SHARD_IBEAM_PATH}" transform="translate(0.25, 0.6)" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="3.4" stroke-linecap="square" stroke-linejoin="miter"/>`,
        `<path d="${SHARD_IBEAM_PATH}" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter"/>`,
        `<path d="${SHARD_IBEAM_PATH}" fill="none" stroke="#0B1310" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/>`,
        `<path d="M5.4 12.5L7.0 10.9L8.6 12.5L7.0 14.1Z" fill="#34D399" stroke="#0B1310" stroke-width="0.6"/>`,
      ].join('');
    }
    return [
      `<path d="${SHARD_ARROW_PATH}" transform="translate(0.35, 0.7)" fill="rgba(0,0,0,0.25)" stroke="rgba(0,0,0,0.25)" stroke-width="2.1" stroke-linejoin="miter"/>`,
      `<path d="${SHARD_ARROW_PATH}" fill="#0B1310" stroke="#FFFFFF" stroke-width="1.9" stroke-linejoin="miter"/>`,
      `<path d="${SHARD_ARROW_PATH}" fill="#0B1310" stroke="#34D399" stroke-width="0.95" stroke-linejoin="miter"/>`,
      `<path d="${SHARD_SPINE_PATH}" fill="none" stroke="#34D399" stroke-width="0.85" stroke-linecap="round"/>`,
    ].join('');
  }

  if (style === 'archival-nib') {
    if (variant === 'pointer') {
      return [
        `<path d="${NIB_HAND_PATH}" transform="translate(0.35, 0.8)" fill="rgba(0,0,0,0.2)" stroke="rgba(0,0,0,0.2)" stroke-width="1.9" stroke-linejoin="round"/>`,
        `<path d="${NIB_HAND_PATH}" fill="#FAF3E3" stroke="#451A03" stroke-width="1.75" stroke-linejoin="round"/>`,
        `<path d="M10.2 19.6L17.4 19.6" stroke="#D97706" stroke-width="1.5" stroke-linecap="round"/>`,
      ].join('');
    }
    if (variant === 'text') {
      return [
        `<path d="${NIB_IBEAM_PATH}" transform="translate(0.25, 0.55)" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<path d="${NIB_IBEAM_PATH}" fill="none" stroke="#FAF3E3" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<path d="${NIB_IBEAM_PATH}" fill="none" stroke="#78350F" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<circle cx="7.0" cy="12.5" r="1.25" fill="#D97706" stroke="#451A03" stroke-width="0.55"/>`,
      ].join('');
    }
    return [
      `<path d="${NIB_ARROW_PATH}" transform="translate(0.35, 0.7)" fill="rgba(0,0,0,0.2)" stroke="rgba(0,0,0,0.2)" stroke-width="1.8" stroke-linejoin="round"/>`,
      `<path d="${NIB_ARROW_PATH}" fill="#FAF3E3" stroke="#451A03" stroke-width="1.55" stroke-linejoin="round"/>`,
      `<path d="${NIB_COLLAR_PATH}" fill="none" stroke="#D97706" stroke-width="1.1" stroke-linecap="round"/>`,
      `<path d="${NIB_SLIT_PATH}" fill="none" stroke="#451A03" stroke-width="0.85" stroke-linecap="round"/>`,
      `<circle cx="8.6" cy="8.4" r="1.25" fill="#B45309"/>`,
    ].join('');
  }

  if (style === 'crisp-pixel') {
    if (variant === 'pointer') {
      return [
        `<path d="${PIXEL_HAND_OUTLINE}" transform="translate(1, 1)" fill="rgba(0,0,0,0.24)"/>`,
        `<path d="${PIXEL_HAND_FILL}" fill="#FFFFFF"/>`,
        `<path d="${PIXEL_HAND_OUTLINE}" fill="#0B0B0E"/>`,
      ].join('');
    }
    if (variant === 'text') {
      return [
        `<path d="${PIXEL_IBEAM_OUTER}" transform="translate(1, 1)" fill="rgba(0,0,0,0.2)"/>`,
        `<path d="${PIXEL_IBEAM_OUTER}" fill="#FFFFFF"/>`,
        `<path d="${PIXEL_IBEAM_INNER}" fill="#0B0B0E"/>`,
        `<rect x="5" y="12" width="4" height="1" fill="#0B0B0E"/>`,
      ].join('');
    }
    return [
      `<path d="${PIXEL_ARROW_OUTLINE}" transform="translate(1, 1)" fill="rgba(0,0,0,0.24)"/>`,
      `<path d="${PIXEL_ARROW_FILL}" fill="#FFFFFF"/>`,
      `<path d="${PIXEL_ARROW_OUTLINE}" fill="#0B0B0E"/>`,
    ].join('');
  }

  // Default: macos
  if (variant === 'pointer') {
    return [
      `<path d="${MACOS_HAND_PATH}" transform="translate(0.35, 0.8)" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.22)" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>`,
      `<path d="${MACOS_HAND_PATH}" fill="#FFFFFF" stroke="#0B0B0E" stroke-width="1.85" stroke-linejoin="round" stroke-linecap="round"/>`,
      `<path d="${MACOS_CREASES_PATH}" fill="none" stroke="#B8BAC0" stroke-width="1.25" stroke-linecap="round"/>`,
    ].join('');
  }

  if (variant === 'text') {
    return [
      `<path d="${MACOS_IBEAM_PATH}" transform="translate(0.2, 0.5)" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<path d="${MACOS_IBEAM_PATH}" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<path d="${MACOS_IBEAM_PATH}" fill="none" stroke="#0B0B0E" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    ].join('');
  }

  return [
    `<path d="${MACOS_ARROW_PATH}" transform="translate(0.25, 0.65)" fill="rgba(0,0,0,0.18)" stroke="rgba(0,0,0,0.18)" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round"/>`,
    `<path d="${MACOS_ARROW_PATH}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.55" stroke-linejoin="round" stroke-linecap="round"/>`,
    `<path d="${MACOS_ARROW_PATH}" fill="#0B0B0E" stroke="#0B0B0E" stroke-width="0.85" stroke-linejoin="round" stroke-linecap="round"/>`,
  ].join('');
}

let cachedImageSetSupport: 'std' | 'webkit' | 'none' | null = null;
function detectCursorImageSetSupport(): 'std' | 'webkit' | 'none' {
  if (cachedImageSetSupport !== null) return cachedImageSetSupport;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    if (CSS.supports('cursor', 'image-set(url("data:image/gif;base64,R0lGODlhAQABAAAAACw=") 1x) 0 0, auto')) {
      cachedImageSetSupport = 'std';
      return 'std';
    }
    if (CSS.supports('cursor', '-webkit-image-set(url("data:image/gif;base64,R0lGODlhAQABAAAAACw=") 1x) 0 0, auto')) {
      cachedImageSetSupport = 'webkit';
      return 'webkit';
    }
  }
  cachedImageSetSupport = 'none';
  return 'none';
}

function buildSvgDataUrl(
  width: number,
  height: number,
  viewBox: string,
  variant: MacOsCursorVariant,
  style: CursorStyleId,
  scale = 1
): string {
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const meta = getCursorPackMeta(style);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}" shape-rendering="${meta.shapeRendering}" fill="none">${renderVariantSvgInner(variant, style, 'g')}</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

/**
 * Generates Retina/HiDPI crisp hardware-composited CSS `cursor` strings using `image-set` (1x/1.5x/2x/3x).
 */
export function buildMacOsCursorCssValue(
  size = 16.5,
  variant: MacOsCursorVariant = 'default',
  style: CursorStyleId = 'macos'
): string {
  const normalizedStyle = normalizeCursorStyle(style);
  const { width, height, viewBox, hx, hy } = getCursorDimensions(size, variant, normalizedStyle);
  const fallback = variant === 'pointer' ? 'pointer' : variant === 'text' ? 'text' : 'auto';
  const support = detectCursorImageSetSupport();

  const u1 = buildSvgDataUrl(width, height, viewBox, variant, normalizedStyle, 1);
  if (support === 'std') {
    const u15 = buildSvgDataUrl(width, height, viewBox, variant, normalizedStyle, 1.5);
    const u2 = buildSvgDataUrl(width, height, viewBox, variant, normalizedStyle, 2);
    const u3 = buildSvgDataUrl(width, height, viewBox, variant, normalizedStyle, 3);
    return `image-set(${u1} 1x, ${u15} 1.5x, ${u2} 2x, ${u3} 3x) ${hx} ${hy}, ${fallback}`;
  }
  if (support === 'webkit') {
    const u2 = buildSvgDataUrl(width, height, viewBox, variant, normalizedStyle, 2);
    const u3 = buildSvgDataUrl(width, height, viewBox, variant, normalizedStyle, 3);
    return `-webkit-image-set(${u1} 1x, ${u2} 2x, ${u3} 3x) ${hx} ${hy}, ${fallback}`;
  }
  return `${u1} ${hx} ${hy}, ${fallback}`;
}

export default function MacOsCursorSvg({
  className = '',
  size = 16.5,
  variant = 'default',
  style = 'macos',
}: MacOsCursorSvgProps) {
  const rawId = useId();
  const gradId = `bw_cur_${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const normalizedStyle = normalizeCursorStyle(style);
  const meta = getCursorPackMeta(normalizedStyle);
  const { width, height, viewBox } = getCursorDimensions(size, variant, normalizedStyle);

  const renderSvgNodes = () => {
    if (normalizedStyle === 'prismatic') {
      const gradStops =
        variant === 'pointer' ? (
          <linearGradient id={gradId} x1="15%" y1="95%" x2="88%" y2="5%">
            <stop offset="0%" stopColor="#9EF01A" />
            <stop offset="32%" stopColor="#FFB800" />
            <stop offset="65%" stopColor="#FF4D1A" />
            <stop offset="100%" stopColor="#FF1493" />
          </linearGradient>
        ) : (
          <linearGradient id={gradId} x1="5%" y1="25%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#FF1493" />
            <stop offset="38%" stopColor="#FF551A" />
            <stop offset="72%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#A3E635" />
          </linearGradient>
        );

      if (variant === 'pointer') {
        return (
          <>
            <defs>{gradStops}</defs>
            <path
              d={PRISMATIC_HAND_PATH}
              transform="translate(0.45, 0.8)"
              fill="rgba(0,0,0,0.22)"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="2.35"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={PRISMATIC_HAND_PATH}
              fill={`url(#${gradId})`}
              stroke={`url(#${gradId})`}
              strokeWidth="2.3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path d={PRISMATIC_HAND_PATH} fill="#FFFFFF" />
          </>
        );
      }
      if (variant === 'text') {
        return (
          <>
            <defs>{gradStops}</defs>
            <path
              d={PRISMATIC_IBEAM_PATH}
              transform="translate(0.3, 0.65)"
              fill="none"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="4.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={PRISMATIC_IBEAM_PATH}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={PRISMATIC_IBEAM_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      }
      return (
        <>
          <defs>{gradStops}</defs>
          <path
            d={PRISMATIC_ARROW_PATH}
            transform="translate(0.45, 0.75)"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="2.45"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={PRISMATIC_ARROW_PATH}
            fill={`url(#${gradId})`}
            stroke={`url(#${gradId})`}
            strokeWidth="2.35"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d={PRISMATIC_ARROW_PATH} fill="#FFFFFF" />
        </>
      );
    }

    if (normalizedStyle === 'chroma-cur') {
      if (variant === 'pointer') {
        return (
          <>
            <path
              d={CUR_AMBER_HAND_PATH}
              transform="translate(0.4, 0.75)"
              fill="none"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={CUR_AMBER_HAND_PATH}
              fill="rgba(255,248,238,0.16)"
              stroke="#451A03"
              strokeWidth="2.35"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={CUR_AMBER_HAND_PATH}
              fill="none"
              stroke="#E2985C"
              strokeWidth="1.55"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        );
      }
      if (variant === 'text') {
        return (
          <>
            <path
              d={CUR_RED_IBEAM_PATH}
              transform="translate(0.3, 0.6)"
              fill="rgba(0,0,0,0.2)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.35"
              strokeLinejoin="round"
            />
            <path
              d={CUR_RED_IBEAM_PATH}
              fill="#E05252"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d={CUR_RED_IBEAM_PATH}
              fill="#E05252"
              stroke="#991B1B"
              strokeWidth="0.45"
              strokeLinejoin="round"
            />
            <path d="M7.0 5.5L7.0 19.5" stroke="#FECACA" strokeWidth="0.6" strokeLinecap="round" />
          </>
        );
      }
      return (
        <>
          <path
            d={CUR_BLUE_ARROW_PATH}
            transform="translate(0.35, 0.75)"
            fill="rgba(0,0,0,0.22)"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d={CUR_BLUE_ARROW_PATH}
            fill="#38BDF8"
            stroke="#075985"
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
          <path
            d={CUR_BLUE_HIGHLIGHT}
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    }

    if (normalizedStyle === 'backwoods-shard') {
      if (variant === 'pointer') {
        return (
          <>
            <path
              d={SHARD_HAND_PATH}
              transform="translate(0.35, 0.8)"
              fill="rgba(0,0,0,0.25)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="2.1"
              strokeLinejoin="miter"
            />
            <path d={SHARD_HAND_PATH} fill="#0B1310" stroke="#FFFFFF" strokeWidth="1.95" strokeLinejoin="miter" />
            <path d={SHARD_HAND_PATH} fill="#0B1310" stroke="#34D399" strokeWidth="1.05" strokeLinejoin="miter" />
            <path d="M12.2 14.4L13.7 12.9L15.2 14.4L13.7 15.9Z" fill="#34D399" />
          </>
        );
      }
      if (variant === 'text') {
        return (
          <>
            <path
              d={SHARD_IBEAM_PATH}
              transform="translate(0.25, 0.6)"
              fill="none"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="3.4"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path
              d={SHARD_IBEAM_PATH}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path
              d={SHARD_IBEAM_PATH}
              fill="none"
              stroke="#0B1310"
              strokeWidth="1.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
            <path d="M5.4 12.5L7.0 10.9L8.6 12.5L7.0 14.1Z" fill="#34D399" stroke="#0B1310" strokeWidth="0.6" />
          </>
        );
      }
      return (
        <>
          <path
            d={SHARD_ARROW_PATH}
            transform="translate(0.35, 0.7)"
            fill="rgba(0,0,0,0.25)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="2.1"
            strokeLinejoin="miter"
          />
          <path d={SHARD_ARROW_PATH} fill="#0B1310" stroke="#FFFFFF" strokeWidth="1.9" strokeLinejoin="miter" />
          <path d={SHARD_ARROW_PATH} fill="#0B1310" stroke="#34D399" strokeWidth="0.95" strokeLinejoin="miter" />
          <path d={SHARD_SPINE_PATH} fill="none" stroke="#34D399" strokeWidth="0.85" strokeLinecap="round" />
        </>
      );
    }

    if (normalizedStyle === 'archival-nib') {
      if (variant === 'pointer') {
        return (
          <>
            <path
              d={NIB_HAND_PATH}
              transform="translate(0.35, 0.8)"
              fill="rgba(0,0,0,0.2)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <path d={NIB_HAND_PATH} fill="#FAF3E3" stroke="#451A03" strokeWidth="1.75" strokeLinejoin="round" />
            <path d="M10.2 19.6L17.4 19.6" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      }
      if (variant === 'text') {
        return (
          <>
            <path
              d={NIB_IBEAM_PATH}
              transform="translate(0.25, 0.55)"
              fill="none"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={NIB_IBEAM_PATH}
              fill="none"
              stroke="#FAF3E3"
              strokeWidth="2.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={NIB_IBEAM_PATH}
              fill="none"
              stroke="#78350F"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="7.0" cy="12.5" r="1.25" fill="#D97706" stroke="#451A03" strokeWidth="0.55" />
          </>
        );
      }
      return (
        <>
          <path
            d={NIB_ARROW_PATH}
            transform="translate(0.35, 0.7)"
            fill="rgba(0,0,0,0.2)"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d={NIB_ARROW_PATH} fill="#FAF3E3" stroke="#451A03" strokeWidth="1.55" strokeLinejoin="round" />
          <path d={NIB_COLLAR_PATH} fill="none" stroke="#D97706" strokeWidth="1.1" strokeLinecap="round" />
          <path d={NIB_SLIT_PATH} fill="none" stroke="#451A03" strokeWidth="0.85" strokeLinecap="round" />
          <circle cx="8.6" cy="8.4" r="1.25" fill="#B45309" />
        </>
      );
    }

    if (normalizedStyle === 'crisp-pixel') {
      if (variant === 'pointer') {
        return (
          <>
            <path d={PIXEL_HAND_OUTLINE} transform="translate(1, 1)" fill="rgba(0,0,0,0.24)" />
            <path d={PIXEL_HAND_FILL} fill="#FFFFFF" />
            <path d={PIXEL_HAND_OUTLINE} fill="#0B0B0E" />
          </>
        );
      }
      if (variant === 'text') {
        return (
          <>
            <path d={PIXEL_IBEAM_OUTER} transform="translate(1, 1)" fill="rgba(0,0,0,0.2)" />
            <path d={PIXEL_IBEAM_OUTER} fill="#FFFFFF" />
            <path d={PIXEL_IBEAM_INNER} fill="#0B0B0E" />
            <rect x="5" y="12" width="4" height="1" fill="#0B0B0E" />
          </>
        );
      }
      return (
        <>
          <path d={PIXEL_ARROW_OUTLINE} transform="translate(1, 1)" fill="rgba(0,0,0,0.24)" />
          <path d={PIXEL_ARROW_FILL} fill="#FFFFFF" />
          <path d={PIXEL_ARROW_OUTLINE} fill="#0B0B0E" />
        </>
      );
    }

    // Default: macOS
    if (variant === 'pointer') {
      return (
        <>
          <path
            d={MACOS_HAND_PATH}
            transform="translate(0.35, 0.8)"
            fill="rgba(0, 0, 0, 0.22)"
            stroke="rgba(0, 0, 0, 0.22)"
            strokeWidth="1.9"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={MACOS_HAND_PATH}
            fill="#FFFFFF"
            stroke="#0B0B0E"
            strokeWidth="1.85"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={MACOS_CREASES_PATH}
            fill="none"
            stroke="#B8BAC0"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </>
      );
    }

    if (variant === 'text') {
      return (
        <>
          <path
            d={MACOS_IBEAM_PATH}
            transform="translate(0.2, 0.5)"
            fill="none"
            stroke="rgba(0, 0, 0, 0.16)"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={MACOS_IBEAM_PATH}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={MACOS_IBEAM_PATH}
            fill="none"
            stroke="#0B0B0E"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    }

    return (
      <>
        <path
          d={MACOS_ARROW_PATH}
          transform="translate(0.25, 0.65)"
          fill="rgba(0, 0, 0, 0.18)"
          stroke="rgba(0, 0, 0, 0.18)"
          strokeWidth="2.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={MACOS_ARROW_PATH}
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="2.55"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={MACOS_ARROW_PATH}
          fill="#0B0B0E"
          stroke="#0B0B0E"
          strokeWidth="0.85"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      shapeRendering={meta.shapeRendering}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'block',
        pointerEvents: 'none',
        transform: 'translateZ(0)',
      }}
      aria-hidden="true"
    >
      {renderSvgNodes()}
    </svg>
  );
}
