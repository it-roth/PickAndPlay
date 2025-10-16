import React, { createContext, useState, useEffect } from 'react';
// Simple locale provider: tracks language + currency and provides conversion helpers

export const LocaleContext = createContext({});

const DEFAULT_RATES = {
    USD: 1,
    KHR: 4000, // user requested *4000
    CNY: 7.0,  // approximate; can be updated later
};

const TRANSLATIONS = {
    EN: {
        inStock: 'In Stock',
        outOfStock: 'Out of Stock',
        description: 'Description',
        details: 'Details',
        addToCart: 'Add to Cart',
        yourCart: 'Your Cart',
        continueShopping: 'Continue Shopping',
        shopNow: 'Shop Now',
        viewDeals: 'View Deals',
        // Hero carousel
        hero1_title: 'Find Your Perfect Guitar',
        hero1_description: 'Explore our wide selection of acoustic and electric guitars.',
        hero2_title: 'Professional Gear for Every Level',
        hero2_description: 'From beginners to experts, we have everything you need.',
        hero3_title: 'Special Offers',
        hero3_description: 'Check out our latest deals and promotions.',
        // Categories & sections
        categories_title: 'Guitar Categories',
        categories_subtitle: 'Discover your perfect instrument',
        category_acoustic_desc: 'Rich, natural sound',
        category_electric_desc: 'Powerful & versatile',
        category_classical_desc: 'Traditional elegance',
        category_bass_desc: 'Deep, rhythmic tones',
        featured_title: 'Featured Products',
        featured_subtitle: 'Handpicked instruments for music lovers',
        new_title: 'New Arrivals',
        new_subtitle: 'Fresh additions to our collection',
        loading_products: 'Loading amazing products...',
        discovering_new: 'Discovering new instruments...',
        // Filters / Shop
        filters_title: 'Filters',
        search_label: 'Search',
        search_placeholder: 'Search guitars...',
        category: 'Category',
        all_categories: 'All Categories',
        price_range: 'Price Range',
        min: 'Min',
        max: 'Max',
        brand: 'Brand',
        all_brands: 'All Brands',
        sort_by: 'Sort By',
        sort_name: 'Name (A-Z)',
        sort_price_asc: 'Price (Low to High)',
        sort_price_desc: 'Price (High to Low)',
        reset_filters: 'Reset Filters',
        no_products: 'No products found matching your criteria.',
        // Navbar / site
        home: 'HOME',
        shop: 'SHOP',
        about: 'ABOUT US',
        contact: 'CONTACT US',
        signIn: 'Sign in',
        blackFriday: 'Black Friday',
        browse: 'Browse',
        // Footer
        footerDescription: 'Your ultimate destination for quality guitars and accessories at fair prices.',
        features: 'Features',
        legal: 'Legal',
        download: 'Download',
        privacyPolicy: 'Privacy Policy',
        licensing: 'Licensing',
        terms: 'Terms & Conditions',
        ios: 'iOS',
        android: 'Android',
        windows: 'Windows',
        macos: 'MacOS',
        copyright: 'Pick & Play Guitar Shop. All rights reserved.'
    },
    KH: {
        inStock: 'មានស្តុក',
        outOfStock: 'អស់ពីស្តុក',
        description: 'ការពិពណ៌នា',
        details: 'ពត៌មានលម្អិត',
        addToCart: 'ចូលទៅទិញ',
        yourCart: 'រទេះរបស់អ្នក',
        continueShopping: 'បន្តទិញពីហាង',
        shopNow: 'ទិញឥឡូវ',
        viewDeals: 'មើលលក់ពិសេស',
        // Hero carousel (Khmer)
        hero1_title: 'រកគីតាតែមួយដែលសាកសមចំពោះអ្នក',
        hero1_description: 'ស្វែងរកជម្រើសធំទូលាយនៃគីតាអាកូស្ទិច និងអេឡិចត្រូនិច។',
        hero2_title: 'ឧបករណ៍វិជ្ជាជីវៈសម្រាប់គ្រប់កម្រិត',
        hero2_description: 'ចាប់ពីអ្នកចាប់ផ្តើមដល់អ្នកមានជំនាញយ៉ាងជ្រាលជ្រៅ យើងមានអីៗគ្រប់យ៉ាងដែលអ្នកត្រូវការ។',
        hero3_title: 'ការផ្តល់ជូនពិសេស',
        hero3_description: 'ពិនិត្យមើលការផ្តល់ជូន និងការបញ្ចុះតម្លៃថ្មីៗរបស់យើង។',
        // Navbar / site
        home: 'ទំព័រដើម',
        shop: 'ហាង',
        about: 'អំពីយើង',
        contact: 'ទំនាក់ទំនង',
        signIn: 'ចូល',
        blackFriday: 'Black Friday',
        // Categories (Khmer)
        category_acoustic_desc: 'សម្លេងស្រស់ស្រាយ និងធម្មជាតិ',
        category_electric_desc: 'កម្លាំង និងចម្រុះ',
        category_classical_desc: 'ភាពអស្ចារ្យប្រពៃណី',
        category_bass_desc: 'សម្លេងជ្រៅ និងមានបេះដូងរhythm',
        // Sections
        categories_title: 'ប្រភេទគីតា',
        categories_subtitle: 'ស្វែងរកឧបករណ៍ដែលសាកសមសម្រាប់អ្នក',
        featured_title: 'ផលិតផលពិសេស',
        featured_subtitle: 'ឧបករណ៍ដែលបានជ្រើសសម្រាប់អ្នកស្រឡាញ់តន្ត្រី',
        new_title: 'ផលិតផលថ្មី',
        new_subtitle: 'ផលិតផលថ្មីៗក្នុងការប្រមូលរបស់យើង',
        loading_products: 'កំពុង​ផ្ទុក​ផលិតផល​អស្ចារ្យ...',
        discovering_new: 'កំពុងស្វែងរកឧបករណ៍ថ្មី...',
        // Filters / Shop
        filters_title: 'តម្រង',
        search_label: 'ស្វែងរក',
        search_placeholder: 'ស្វែងរកគីតា...',
        category: 'ប្រភេទ',
        all_categories: 'គ្រប់ប្រភេទ',
        price_range: 'ចន្លោះតម្លៃ',
        min: 'ទាប',
        max: 'ខ្ពស់',
        brand: 'ម៉ាក',
        all_brands: 'គ្រប់ម៉ាក',
        sort_by: 'លំដាប់',
        sort_name: 'តាមឈ្មោះ (A-Z)',
        sort_price_asc: 'តម្លៃ (ទាបទៅខ្ពស់)',
        sort_price_desc: 'តម្លៃ (ខ្ពស់ទៅទាប)',
        reset_filters: 'ស្តារតម្រង',
        no_products: 'មិនមានផលិតផលដែលត្រូវតាមលក្ខខណ្ឌទេ។',
        // Footer
        footerDescription: 'គោលដៅចុងក្រោយរបស់អ្នកសម្រាប់គីតាដ៏មានគុណភាព និងគ្រឿងបន្លាស់ដោយមានតម្លៃត្រឹមត្រូវ។',
        features: 'លក្ខណៈពិសេស',
        legal: 'ច្បាប់',
        download: 'ទាញយក',
        privacyPolicy: 'គោលនយោបាយឯកជន',
        licensing: 'ការអនុញ្ញាត',
        terms: 'លក្ខខណ្ឌ',
        ios: 'iOS',
        android: 'Android',
        windows: 'Windows',
        macos: 'MacOS',
        copyright: 'Pick & Play Guitar Shop. រក្សាសិទ្ធិ​គ្រប់យ៉ាង'
    },
    ZH: {
        inStock: '有库存',
        outOfStock: '无库存',
        description: '描述',
        details: '详情',
        addToCart: '加入购物车',
        yourCart: '您的购物车',
        continueShopping: '继续购物',
        shopNow: '立即购买',
        viewDeals: '查看优惠',
        // Hero carousel (Chinese)
        hero1_title: '找到完美吉他',
        hero1_description: '探索我们广泛的原声和电吉他系列。',
        hero2_title: '适合各级别的专业装备',
        hero2_description: '从初学者到专家，我们拥有您需要的一切。',
        hero3_title: '特别优惠',
        hero3_description: '查看我们的最新优惠与促销信息。',
        // Navbar / site
        home: '首页',
        shop: '商店',
        about: '关于我们',
        contact: '联系我们',
        signIn: '登录',
        blackFriday: 'Black Friday',
        browse: '浏览',
        // Categories
        category_acoustic_desc: '丰富、自然的声音',
        category_electric_desc: '强力且多才多艺',
        category_classical_desc: '传统的优雅',
        category_bass_desc: '深沉、有节奏感的音色',
        // Footer
        footerDescription: '您购买优质吉他和配件的终极之选，价格公道。',
        // Sections
        categories_title: '吉他类别',
        categories_subtitle: '发现适合您的乐器',
        featured_title: '精选产品',
        featured_subtitle: '为音乐爱好者精心挑选的乐器',
        new_title: '新品上架',
        new_subtitle: '我们收藏的新成员',
        loading_products: '正在加载精彩商品...',
        discovering_new: '发现新乐器...',
        // Filters / Shop
        filters_title: '筛选',
    search_label: '搜索',
    search_placeholder: '搜索吉他...',
    category: '类别',
    all_categories: '所有类别',
    price_range: '价格范围',
    min: '最小',
    max: '最大',
    brand: '品牌',
    all_brands: '所有品牌',
    sort_by: '排序方式',
    sort_name: '名称 (A-Z)',
    sort_price_asc: '价格 (从低到高)',
    sort_price_desc: '价格 (从高到低)',
    reset_filters: '重置筛选',
    no_products: '未找到符合条件的商品。',
        discovering_new: '发现新乐器...',
        features: '特色',
        legal: '法律',
        download: '下载',
        privacyPolicy: '隐私政策',
        licensing: '许可',
        terms: '条款和条件',
        ios: 'iOS',
        android: 'Android',
        windows: 'Windows',
        macos: 'MacOS',
        copyright: 'Pick & Play Guitar Shop。 版权所有。'
    }
};

export function LocaleProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('pp_lang') || 'EN');
    const [currency, setCurrency] = useState(() => localStorage.getItem('pp_currency') || (lang === 'KH' ? 'KHR' : 'USD'));
    const [rates, setRates] = useState(DEFAULT_RATES);

    useEffect(() => {
        localStorage.setItem('pp_lang', lang);
        // if currency wasn't explicitly set, pick sensible default
        if (!localStorage.getItem('pp_currency')) {
            localStorage.setItem('pp_currency', currency);
        }
    }, [lang, currency]);

    // Apply Khmer-specific font class to body when KH is selected
    useEffect(() => {
        try {
            if (lang === 'KH') {
                document.body.classList.add('lang-kh');
            } else {
                document.body.classList.remove('lang-kh');
            }
        } catch (e) {
            // server-side rendering or missing document
        }
    }, [lang]);

    const setLanguage = (value) => {
        setLang(value);
        // map language to default currency if appropriate
        const map = { EN: 'USD', KH: 'KHR', ZH: 'CNY' };
        const newCurrency = map[value] || 'USD';
        setCurrency(newCurrency);
        localStorage.setItem('pp_lang', value);
        localStorage.setItem('pp_currency', newCurrency);
    };

    const setCurrencyAndLang = (value) => {
        setCurrency(value);
        const map = { USD: 'EN', KHR: 'KH', CNY: 'ZH' };
        const newLang = map[value] || 'EN';
        setLang(newLang);
        localStorage.setItem('pp_currency', value);
        localStorage.setItem('pp_lang', newLang);
    };

    const convertPrice = (value) => {
        // value assumed stored in USD base
        const rate = rates[currency] || 1;
        return (parseFloat(value) || 0) * rate;
    };

    // Helper to pick product-localized fields like name_KH, description_ZH, etc.
    const tProduct = (product = {}, field = 'name') => {
        if (!product) return '';
        const suffix = lang === 'EN' ? '' : (lang === 'KH' ? '_KH' : lang === 'ZH' ? '_ZH' : '');
        // prefer full field with suffix, then fallback to original
        const key = `${field}${suffix}`;
        return (product[key] !== undefined && product[key] !== null && product[key] !== '') ? product[key] : (product[field] || '');
    };

    const t = (key) => {
        return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.EN[key] || key;
    };

    return (
        <LocaleContext.Provider value={{ lang, currency, setLanguage, setCurrency: setCurrencyAndLang, convertPrice, t, tProduct }}>
            {children}
        </LocaleContext.Provider>
    );
}

export default LocaleProvider;
