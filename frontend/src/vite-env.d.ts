/// <reference types="vite/client" />

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  export type Icon = FC<IconProps>;
  export const LayoutDashboard: Icon;
  export const Wand2: Icon;
  export const Stethoscope: Icon;
  export const GitCompare: Icon;
  export const Minimize2: Icon;
  export const Bookmark: Icon;
  export const ChevronRight: Icon;
  export const ChevronLeft: Icon;
  export const BookOpen: Icon;
  export const Cpu: Icon;
  export const Terminal: Icon;
  export const Sparkles: Icon;
  export const Server: Icon;
  export const CheckCircle: Icon;
  export const CheckCircle2: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const Play: Icon;
  export const Pause: Icon;
  export const SkipForward: Icon;
  export const SkipBack: Icon;
  export const RotateCcw: Icon;
  export const RotateCw: Icon;
  export const XCircle: Icon;
  export const Plus: Icon;
  export const Trash2: Icon;
  export const ArrowRight: Icon;
  export const Download: Icon;
  export const Upload: Icon;
  export const RefreshCw: Icon;
  export const HelpCircle: Icon;
  export const Code2: Icon;
  export const Send: Icon;
  export const Loader2: Icon;
  export const Share2: Icon;
  export const ShieldCheck: Icon;
  export const Wrench: Icon;
  export const Check: Icon;
  export const Layers: Icon;
  export const Search: Icon;
  const icons: Record<string, Icon>;
  export default icons;
}

