import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'product' | 'article';
    productPrice?: number;
    productCurrency?: string;
}

const defaultTitle = 'Decorizz - Premium Wall Frames & Canvas Art';
const defaultDescription = 'Discover 300+ premium wall frames and canvas art for your home decor. Ethically sourced, handcrafted by skilled artisans.';
const defaultImage = '/og-image.jpg';
const siteUrl = 'https://decorizz.com';

export function SEO({
    title,
    description = defaultDescription,
    image = defaultImage,
    url = '',
    type = 'website',
    productPrice,
    productCurrency = 'INR'
}: SEOProps) {
    const fullTitle = title ? `${title} | Decorizz` : defaultTitle;
    const fullUrl = `${siteUrl}${url}`;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content="Decorizz" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Canonical URL */}
            <link rel="canonical" href={fullUrl} />

            {/* Product-specific meta (for product pages) */}
            {type === 'product' && productPrice && (
                <>
                    <meta property="product:price:amount" content={String(productPrice)} />
                    <meta property="product:price:currency" content={productCurrency} />
                </>
            )}
        </Helmet>
    );
}

export default SEO;
