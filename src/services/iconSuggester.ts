import {
    LucideIcon,
    Users, Code, Mail, FileText, Target,
    Dumbbell, UtensilsCrossed, Moon, Pill, ShoppingCart,
    Sparkles, Phone, BookOpen, GraduationCap, PenLine, Circle,
    Coffee, Music, Plane, Heart, Star, Home, Briefcase,
} from 'lucide-react';

/**
 * Именованный реестр иконок задачи (имя → компонент lucide).
 * Единый источник истины и для авто-подбора, и для ручного выбора
 * пользователем в TaskSheet. Имя хранится в `Task.icon` (строка).
 */
export const TASK_ICON_REGISTRY: Record<string, LucideIcon> = {
    // Работа
    Users, Code, Mail, FileText, Target, Briefcase, Phone, PenLine,
    // Здоровье
    Dumbbell, UtensilsCrossed, Moon, Pill,
    // Быт
    ShoppingCart, Sparkles, Home, Coffee,
    // Учёба
    BookOpen, GraduationCap,
    // Прочее / эмоции
    Music, Plane, Heart, Star, Circle,
};

// Порядок вывода в UI выбора иконок.
export const TASK_ICON_NAMES: string[] = [
    'Target', 'Code', 'Users', 'Mail', 'FileText', 'Briefcase', 'Phone', 'PenLine',
    'Dumbbell', 'UtensilsCrossed', 'Moon', 'Pill',
    'ShoppingCart', 'Sparkles', 'Home', 'Coffee',
    'BookOpen', 'GraduationCap',
    'Music', 'Plane', 'Heart', 'Star', 'Circle',
];

// Fallback по умолчанию
export const DEFAULT_TASK_ICON = 'Circle';

/** Авто-подбор: ключевые слова → имя иконки. */
const ICON_PATTERN_MAP: Record<string, string> = {
    // Работа
    'встреч|созвон|митинг|meeting': 'Users',
    'код|program|разработ|dev|fix|баг': 'Code',
    'письм|email|почт|mail': 'Mail',
    'отчёт|report|доклад': 'FileText',
    'план|plan|стратег': 'Target',
    'работ|дело|офис|work|office': 'Briefcase',
    // Здоровье
    'трен|спорт|бег|gym|workout|йога': 'Dumbbell',
    'еда|обед|ужин|завтрак|food|lunch': 'UtensilsCrossed',
    'сон|спать|отдых|rest|sleep': 'Moon',
    'таблетк|лекарств|медицин': 'Pill',
    // Быт
    'купить|магазин|shop|покупк': 'ShoppingCart',
    'убор|чист|уборк|clean': 'Sparkles',
    'дом|house|ремонт|home': 'Home',
    'кофе|coffee|чай': 'Coffee',
    'звонок|позвонить|phone|call': 'Phone',
    // Учёба
    'читать|книг|read|book': 'BookOpen',
    'учить|учёба|study|курс': 'GraduationCap',
    'писать|текст|write|статья': 'PenLine',
    // Прочее
    'музык|music|песн': 'Music',
    'путёв|путеше|travel|trip|самолёт|перелёт': 'Plane',
    'любим|семь|family|сердц': 'Heart',
    'звёзд|star|важн|goal': 'Star',
};

/** Возвращает имя иконки по ключевым словам названия (или дефолт). */
export function suggestIconName(title: string): string {
    const normalizedTitle = title.toLowerCase().trim();

    for (const [pattern, iconName] of Object.entries(ICON_PATTERN_MAP)) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(normalizedTitle)) {
            return iconName;
        }
    }

    return DEFAULT_TASK_ICON;
}

/** Возвращает компонент иконки по имени из реестра (fallback — Circle). */
export function getTaskIconByName(name: string | undefined | null): LucideIcon {
    if (name && TASK_ICON_REGISTRY[name]) {
        return TASK_ICON_REGISTRY[name];
    }
    return TASK_ICON_REGISTRY[DEFAULT_TASK_ICON];
}

/** Обратная совместимость: авто-подбор компонента по названию. */
export function suggestIcon(title: string): LucideIcon {
    return getTaskIconByName(suggestIconName(title));
}