package com.ycngmn.nobook.data.model

data class FontOption(
    val id: String,
    val nameBn: String,
    val nameEn: String,
    val fontCss: String,
    val importUrl: String? = null,
    val previewText: String = "কেমন আছেন? Facebook N ফন্ট টেস্ট"
)

object FontPresets {
    val options = listOf(
        FontOption(
            id = "default",
            nameBn = "ডিফল্ট সিস্টেম ফন্ট",
            nameEn = "Default System",
            fontCss = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            importUrl = null,
            previewText = "ডিফল্ট ফেসবুক লেখার রূপ"
        ),
        FontOption(
            id = "hind_siliguri",
            nameBn = "সুন্দর বাংলা ফন্ট (Hind Siliguri)",
            nameEn = "Hind Siliguri (Bangla Clean)",
            fontCss = "'Hind Siliguri', 'Kalpurush', 'SolaimanLipi', Roboto, sans-serif",
            importUrl = "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap",
            previewText = "আ মরি বাংলা ভাষা, অপরূপ রূপ তোমার"
        ),
        FontOption(
            id = "roboto",
            nameBn = "আধুনিক সান্স-সেরিফ (Roboto)",
            nameEn = "Roboto (Modern Clean)",
            fontCss = "'Roboto', 'Open Sans', 'Segoe UI', sans-serif",
            importUrl = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
            previewText = "The quick brown fox jumps over the lazy dog"
        ),
        FontOption(
            id = "serif",
            nameBn = "সেরিফ / ক্লাসিক বইয়ের ফন্ট",
            nameEn = "Serif / Classic Book",
            fontCss = "serif, 'Times New Roman', 'Georgia', 'Noto Serif Bengali'",
            importUrl = null,
            previewText = "বইয়ের পাতার মতো ক্লাসিক সাহিত্যের অনুভূতি"
        ),
        FontOption(
            id = "cursive",
            nameBn = "স্টাইলিশ কার্সিভ / ক্যালিগ্রাফি",
            nameEn = "Cursive / Calligraphy",
            fontCss = "cursive, 'Brush Script MT', 'Segoe Script', 'Comic Sans MS'",
            importUrl = null,
            previewText = "সুন্দর বাঁকানো স্টাইলিশ ফন্ট"
        ),
        FontOption(
            id = "monospace",
            nameBn = "মনোস্পেস / কোডার ফন্ট",
            nameEn = "Monospace (Typewriter)",
            fontCss = "monospace, 'Courier New', 'Consolas'",
            importUrl = null,
            previewText = "console.log('Facebook N');"
        ),
        FontOption(
            id = "quicksand",
            nameBn = "গোলগাল ও সফট (Quicksand)",
            nameEn = "Quicksand (Rounded Soft)",
            fontCss = "'Quicksand', system-ui, -apple-system, sans-serif",
            importUrl = "https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap",
            previewText = "সফট এবং আকর্ষণীয় গোলগাল অক্ষর"
        )
    )

    fun getById(id: String): FontOption {
        return options.firstOrNull { it.id == id } ?: options.first()
    }
}
