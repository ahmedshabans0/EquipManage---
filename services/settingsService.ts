import { supabase } from './supabaseClient';

/**
 * Settings Service
 * Manage system settings (app name, currency, categories, etc.)
 */

export interface SystemSettings {
    appName: string;
    itemName: string;
    itemsName: string;
    categoryLabel: string;
    identifierLabel: string;
    currency: string;
    categories: string[];
}

/**
 * Get system settings
 */
export const getSettings = async (): Promise<SystemSettings | null> => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.error('Error fetching settings:', error);
            return null;
        }

        return {
            appName: data.app_name,
            itemName: data.item_name,
            itemsName: data.items_name,
            categoryLabel: data.category_label,
            identifierLabel: data.identifier_label,
            currency: data.currency,
            categories: data.categories || [],
        };
    } catch (err) {
        console.error('Exception fetching settings:', err);
        return null;
    }
};

/**
 * Update system settings
 */
export const updateSettings = async (settings: SystemSettings): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('settings')
            .update({
                app_name: settings.appName,
                item_name: settings.itemName,
                items_name: settings.itemsName,
                category_label: settings.categoryLabel,
                identifier_label: settings.identifierLabel,
                currency: settings.currency,
                categories: settings.categories,
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1);

        if (error) {
            console.error('Error updating settings:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Exception updating settings:', err);
        return false;
    }
};

/**
 * Update categories only
 */
export const updateCategories = async (categories: string[]): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('settings')
            .update({
                categories: categories,
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1);

        if (error) {
            console.error('Error updating categories:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Exception updating categories:', err);
        return false;
    }
};

/**
 * Apply preset settings
 */
export const applyPreset = async (
    type: 'equipment' | 'cars' | 'properties' | 'events' | 'photography'
): Promise<SystemSettings | null> => {
    let settings: SystemSettings;

    if (type === 'equipment') {
        settings = {
            appName: 'إيجار برو',
            itemName: 'معدة',
            itemsName: 'المعدات',
            categoryLabel: 'التصنيف',
            identifierLabel: 'الرقم التسلسلي',
            currency: 'ر.س',
            categories: ['معدات ثقيلة', 'مولدات', 'رافعات', 'عدد يدوية'],
        };
    } else if (type === 'cars') {
        settings = {
            appName: 'كار رينتال',
            itemName: 'سيارة',
            itemsName: 'السيارات',
            categoryLabel: 'الفئة',
            identifierLabel: 'رقم اللوحة',
            currency: 'ر.س',
            categories: ['سيدان', 'دفع رباعي', 'فاخرة', 'نقل'],
        };
    } else if (type === 'properties') {
        settings = {
            appName: 'عقاراتي',
            itemName: 'وحدة',
            itemsName: 'الوحدات',
            categoryLabel: 'نوع العقار',
            identifierLabel: 'رقم الصك/الوحدة',
            currency: 'ر.س',
            categories: ['شقة', 'فيلا', 'مكتب', 'مستودع'],
        };
    } else if (type === 'events') {
        settings = {
            appName: 'إيفنت ماستر',
            itemName: 'غرض',
            itemsName: 'الأغراض',
            categoryLabel: 'القسم',
            identifierLabel: 'كود الصنف',
            currency: 'ر.س',
            categories: ['إضاءة', 'صوتيات', 'كراسي وطاولات', 'زينة'],
        };
    } else if (type === 'photography') {
        settings = {
            appName: 'زوم رينتال',
            itemName: 'قطعة',
            itemsName: 'المعدات',
            categoryLabel: 'القسم',
            identifierLabel: 'السيريال',
            currency: 'ج.م',
            categories: ['كاميرات', 'عدسات', 'إضاءة', 'خلفيات', 'صوتيات', 'درون', 'اكسسوارات'],
        };
    } else {
        return null;
    }

    const success = await updateSettings(settings);
    if (success) {
        return settings;
    }

    return null;
};