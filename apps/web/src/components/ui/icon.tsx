import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Box,
  Boxes,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Flame,
  LifeBuoy,
  List,
  HelpCircle,
  Pencil,
  SlidersHorizontal,
  Home,
  Inbox,
  KeyRound,
  LineChart,
  Mail,
  MessageSquare,
  MapPin,
  Menu,
  Package,
  PackageCheck,
  PackageSearch,
  Phone,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Settings,
  Store,
  Sparkles,
  Target,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * Los iconos del producto, nombrados por lo que significan acá y no por su
 * dibujo. Cambiar el trazo de «recepciones» se hace en un solo lugar, y las
 * pantallas no tienen que saber qué librería hay debajo.
 */
export const ICONS = {
  inicio: Home,
  buscar: Search,
  filtros: SlidersHorizontal,
  envios: Truck,
  pedidos: ClipboardList,
  inventario: Package,
  contratos: FileText,
  metricas: LineChart,
  perfil: Settings,
  recepciones: Inbox,
  espacios: Warehouse,
  pagos: CreditCard,
  pymes: Building2,
  bodegueros: Users,
  bodegas: Store,
  discrepancias: AlertTriangle,
  corfo: Target,
  notificaciones: Bell,
  camara: Camera,
  mapa: Compass,
  ubicacion: MapPin,
  telefono: Phone,
  agregar: Plus,
  menu: Menu,
  cerrar: X,
  listo: Check,
  verificado: CheckCircle2,
  siguiente: ChevronRight,
  volver: ArrowLeft,
  ir: ArrowRight,
  bultos: Boxes,
  recibido: PackageCheck,
  sinResultados: PackageSearch,
  paquete: Package,
  correo: Mail,
  clave: KeyRound,
  seguro: ShieldCheck,
  recurrente: RefreshCw,
  reloj: Clock,
  volumen: Box,
  editar: Pencil,
  exportar: Download,
  incidentes: Flame,
  mensajes: MessageSquare,
  lista: List,
  enviar: Send,
  tickets: LifeBuoy,
  ayuda: HelpCircle,
  externo: ExternalLink,
  destacado: Sparkles,
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  /** Lado del icono en px. Sigue el tamaño del texto que acompaña. */
  size?: number;
  className?: string;
  /** Sólo si el icono es la única señal de lo que hace un control. */
  label?: string;
};

export function Icon({ name, size = 18, className = '', label }: Props) {
  const Glyph: LucideIcon = ICONS[name];

  return (
    <Glyph
      size={size}
      strokeWidth={1.9}
      className={`shrink-0 ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  );
}
