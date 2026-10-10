import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'
import { Icon, PrototypeNotice, SiteFooter, SiteHeader, SiteSubNav } from './components/SiteChrome.jsx'

const fallbackSchemes = [
    {
        id: 'pm-kisan',
        name: 'PM-KISAN',
        category: 'Agriculture',
        audience: 'For eligible farmer families',
        description: 'Explore income support for eligible landholding farmer families.',
        source: 'https://pmkisan.gov.in/',
        mark: '01',
    },
    {
        id: 'pm-jay',
        name: 'Ayushman Bharat PM-JAY',
        category: 'Health',
        audience: 'For eligible families',
        description: 'Understand health coverage options and how to check your eligibility.',
        source: 'https://pmjay.gov.in/',
        mark: '02',
    },
    {
        id: 'pmay-urban',
        name: 'PM Awas Yojana (Urban)',
        category: 'Housing',
        audience: 'For eligible urban households',
        description: 'Review housing assistance information and the official application route.',
        source: 'https://pmay-urban.gov.in/',
        mark: '03',
    },
    {
        id: 'scholarships',
        name: 'National Scholarship Portal',
        category: 'Education',
        audience: 'For students across India',
        description: 'Find scholarship programs and prepare for an application.',
        source: 'https://scholarships.gov.in/',
        mark: '04',
    },
    { id: 'pm-ujjwala', name: 'PM Ujjwala Yojana', category: 'Social welfare', audience: 'For eligible women in low-income households', description: 'Explore support for a clean cooking fuel connection and find the official application route.', source: 'https://www.pmuy.gov.in/', mark: '05' },
    { id: 'mgnrega', name: 'Mahatma Gandhi NREGA', category: 'Employment', audience: 'For rural households seeking wage employment', description: 'Learn about the rural employment guarantee and how to request work through your Gram Panchayat.', source: 'https://nrega.nic.in/', mark: '06' },
    { id: 'mudra', name: 'Pradhan Mantri MUDRA Yojana', category: 'Business', audience: 'For micro and small business owners', description: 'Review loan options for starting or growing a small business.', source: 'https://www.mudra.org.in/', mark: '07' },
    { id: 'kcc', name: 'Kisan Credit Card', category: 'Agriculture', audience: 'For farmers and agricultural workers', description: 'Find information about flexible credit for farming and related needs.', source: 'https://www.myscheme.gov.in/schemes/kcc', mark: '08' },
    { id: 'ladli-behna', name: 'Ladli Behna Yojana', category: 'Women', state: 'Madhya Pradesh', audience: 'For eligible women in Madhya Pradesh', description: 'Check the state program information and its current application guidance.', source: 'https://cmladlibahna.mp.gov.in/', mark: '09' },
    { id: 'atal-pension', name: 'Atal Pension Yojana', category: 'Pension', audience: 'For eligible subscribers aged 18 to 40', description: 'Understand the contributory pension scheme and how to enroll through a bank.', source: 'https://www.npscra.nsdl.co.in/scheme-details.php', mark: '10' },
    { id: 'pm-surya-ghar', name: 'PM Surya Ghar: Muft Bijli Yojana', category: 'Energy', audience: 'For residential electricity consumers', description: 'Explore rooftop solar support and the official national portal.', source: 'https://pmsuryaghar.gov.in/', mark: '11' },
    { id: 'sukanya-samriddhi', name: 'Sukanya Samriddhi Account', category: 'Savings', audience: 'For guardians of a girl child', description: 'Learn about this small savings scheme and account opening through banks or post offices.', source: 'https://www.indiapost.gov.in/', mark: '12' },
    { id: 'pm-vishwakarma', name: 'PM Vishwakarma', category: 'Skills', audience: 'For traditional artisans and craftspeople', description: 'See support options for skills, tools, and credit for traditional trades.', source: 'https://pmvishwakarma.gov.in/', mark: '13' },
    { id: 'pmay-gramin', name: 'PM Awas Yojana (Gramin)', category: 'Housing', audience: 'For eligible rural households', description: 'Review rural housing assistance information and where to check beneficiary details.', source: 'https://pmayg.nic.in/', mark: '14' },
    { id: 'pmfby', name: 'Pradhan Mantri Fasal Bima Yojana', category: 'Agriculture', audience: 'For farmers growing notified crops', description: 'Find crop insurance information and the official enrollment portal.', source: 'https://pmfby.gov.in/', mark: '15' },
    { id: 'jan-dhan', name: 'Pradhan Mantri Jan Dhan Yojana', category: 'Banking', audience: 'For people seeking access to banking services', description: 'Learn about basic bank accounts and financial inclusion services.', source: 'https://pmjdy.gov.in/', mark: '16' },
    { id: 'stand-up-india', name: 'Stand-Up India', category: 'Business', audience: 'For women and SC/ST entrepreneurs', description: 'Explore bank loan support for setting up a greenfield enterprise.', source: 'https://www.standupmitra.in/', mark: '17' },
    { id: 'pm-shram-yogi', name: 'PM Shram Yogi Maandhan', category: 'Pension', audience: 'For eligible workers in the unorganized sector', description: 'Review the voluntary contributory pension scheme and enrollment options.', source: 'https://maandhan.in/', mark: '18' },
    { id: 'pm-poshan', name: 'PM POSHAN', category: 'Health', audience: 'For children in eligible schools', description: 'Learn about the school meal program and its nutrition support.', source: 'https://pmposhan.education.gov.in/', mark: '19' },
    { id: 'pm-matru-vandana', name: 'Pradhan Mantri Matru Vandana Yojana', category: 'Women', audience: 'For eligible pregnant and lactating women', description: 'Find information about maternity benefit support and how to apply.', source: 'https://pmmvy.wcd.gov.in/', mark: '20' },
]

const schemesPerPage = 6
const IndianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry']

function formatMarkdownContent(text) {
    if (!text) return null
    const normalizedText = text.replace(/<br\s*\/?>/gi, '  \n')

    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({ children }) => <div className="chat-table-wrap"><table>{children}</table></div>,
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
                }}
            >
                {normalizedText}
            </ReactMarkdown>
        </div>
    )
}

const PROFILE_STORAGE_KEY = 'sevaconnect.profile.v1'

function readSavedProfile() {
    try {
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
        return {
            state: typeof parsed.state === 'string' ? parsed.state : '',
            age: typeof parsed.age === 'string' || typeof parsed.age === 'number' ? String(parsed.age) : '',
            gender: typeof parsed.gender === 'string' ? parsed.gender : '',
            residenceType: typeof parsed.residenceType === 'string' ? parsed.residenceType : '',
            annualFamilyIncome: typeof parsed.annualFamilyIncome === 'string' || typeof parsed.annualFamilyIncome === 'number' ? String(parsed.annualFamilyIncome) : '',
            occupation: typeof parsed.occupation === 'string' ? parsed.occupation : '',
            category: typeof parsed.category === 'string' ? parsed.category : '',
            educationLevel: typeof parsed.educationLevel === 'string' ? parsed.educationLevel : '',
            incomeRange: typeof parsed.incomeRange === 'string' ? parsed.incomeRange : '',
            farmerLandAccess: typeof parsed.farmerLandAccess === 'string' ? parsed.farmerLandAccess : '',
            farmerLandSize: typeof parsed.farmerLandSize === 'string' ? parsed.farmerLandSize : '',
            businessStage: typeof parsed.businessStage === 'string' ? parsed.businessStage : '',
            businessType: typeof parsed.businessType === 'string' ? parsed.businessType : '',
        }
    } catch {
        return null
    }
}

function toAssistantProfile(profile) {
    return {
        ...profile,
        age: Number(profile.age),
        annualFamilyIncome: profile.annualFamilyIncome === '' ? undefined : Number(profile.annualFamilyIncome),
        isFarmer: profile.occupation === 'FARMER',
        isStudent: profile.occupation === 'STUDENT',
    }
}

function formatCategory(category) {
    return String(category || 'Other')
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
function App() {
    const [schemes, setSchemes] = useState(fallbackSchemes)
    const [catalogFallback, setCatalogFallback] = useState(false)
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All schemes')
    const [activeState, setActiveState] = useState('ALL')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({ total: fallbackSchemes.length, totalPages: Math.ceil(fallbackSchemes.length / schemesPerPage) })
    const [catalogueLoading, setCatalogueLoading] = useState(false)
    const [saved, setSaved] = useState([])
    const [selectedScheme, setSelectedScheme] = useState(null)
    const [showProfile, setShowProfile] = useState(false)
    const [showAssistant, setShowAssistant] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profile, setProfile] = useState(() => readSavedProfile() || {
        state: '',
        age: '',
        gender: '',
        residenceType: '',
        annualFamilyIncome: '',
        occupation: '',
        category: '',
        educationLevel: '',
        incomeRange: '',
        farmerLandAccess: '',
        farmerLandSize: '',
        businessStage: '',
        businessType: '',
    })
    const [profileSaved, setProfileSaved] = useState(() => readSavedProfile() !== null)
    const [message, setMessage] = useState('')
    const [conversation, setConversation] = useState([])
    const [conversationId, setConversationId] = useState(null)
    const [assistantSuggestions, setAssistantSuggestions] = useState({ schemes: [], personalized: false, hasMatches: false })
    const [loadingAssistantSuggestions, setLoadingAssistantSuggestions] = useState(false)
    const [showOtherAssistantSchemes, setShowOtherAssistantSchemes] = useState(false)
    const [selectedAssistantSchemeId, setSelectedAssistantSchemeId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [aiLanguage, setAiLanguage] = useState('en')
    const [aiStatus, setAiStatus] = useState({ activeModel: 'SevaConnect AI', activeProvider: 'builtin', isOpenSource: true })
    const [copiedId, setCopiedId] = useState(null)
    const threadEndRef = useRef(null)

    useEffect(() => {
        fetch('/api/v1/ai/status')
            .then((response) => (response.ok ? response.json() : null))
            .then((payload) => {
                if (payload?.success && payload.data) setAiStatus(payload.data)
            })
            .catch(() => { })
    }, [])

    useEffect(() => {
        let isCurrent = true

        const loadCatalogue = async () => {
            setCatalogueLoading(true)
            const params = new URLSearchParams({ page: String(currentPage), limit: String(schemesPerPage) })
            if (query.trim()) params.set('q', query.trim())
            if (activeState !== 'ALL') params.set('state', activeState)
            if (activeCategory !== 'All schemes') params.set('category', activeCategory.toUpperCase().replaceAll(' ', '_'))

            fetch(`/api/v1/schemes?${params}`)
            .then((response) => {
                if (!response.ok) throw new Error(`Scheme API returned ${response.status}`)
                return response.json()
            })
            .then((payload) => {
                const records = payload?.data?.schemes
                if (!payload?.success || !Array.isArray(records)) throw new Error('Scheme API returned an invalid catalogue response')

                const catalogue = records.map((scheme, index) => ({
                    id: scheme.slug || scheme.id || scheme._id || `scheme-${index + 1}`,
                    name: scheme.displayName || scheme.name,
                    category: scheme.cardCategory || formatCategory(scheme.category),
                    categoryKey: scheme.category,
                    state: scheme.state || 'ALL',
                    audience: scheme.audience || 'Check the official source for details',
                    description: scheme.cardDescription || scheme.description,
                    source: scheme.officialUrl,
                    sourceType: scheme.sourceType || 'OFFICIAL',
                    mark: String(scheme.displayOrder || index + 1).padStart(2, '0'),
                }))

                if (isCurrent) {
                    setSchemes(catalogue)
                    setPagination(payload.data.pagination || { total: catalogue.length, totalPages: 1 })
                    setCatalogFallback(false)
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setSchemes(fallbackSchemes)
                    setCatalogFallback(true)
                    setPagination({ total: fallbackSchemes.length, totalPages: Math.ceil(fallbackSchemes.length / schemesPerPage) })
                }
            })
            .finally(() => { if (isCurrent) setCatalogueLoading(false) })
        }

        const debounce = setTimeout(loadCatalogue, query.trim() ? 250 : 0)

        return () => { isCurrent = false; clearTimeout(debounce) }
    }, [currentPage, query, activeCategory, activeState])
    useEffect(() => {
        if (showAssistant) threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation, isLoading, showAssistant])

    useEffect(() => {
        if (!showAssistant) return undefined
        let isCurrent = true
        setLoadingAssistantSuggestions(true)

        fetch('/api/v1/ai/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile: profileSaved ? toAssistantProfile(profile) : {} }),
        })
            .then((response) => response.json().then((payload) => {
                if (!response.ok || !payload?.success) throw new Error(payload?.error?.message || 'Could not load scheme suggestions.')
                return payload.data
            }))
            .then((data) => {
                if (isCurrent) setAssistantSuggestions(data)
            })
            .catch(() => {
                if (isCurrent) {
                    setAssistantSuggestions({
                        schemes: schemes.slice(0, 8).map((scheme) => ({
                            id: scheme.id,
                            name: scheme.name,
                            category: scheme.category,
                            audience: scheme.audience,
                            description: scheme.description,
                            officialUrl: scheme.source,
                            status: '',
                        })),
                        personalized: false,
                        hasMatches: false,
                    })
                }
            })
            .finally(() => { if (isCurrent) setLoadingAssistantSuggestions(false) })

        return () => { isCurrent = false }
    }, [showAssistant, profileSaved, profile, schemes])

    const categories = ['All schemes', 'Agriculture', 'Education', 'Healthcare', 'Housing', 'Employment', 'Energy', 'Social Welfare', 'Women Empowerment', 'Financial Inclusion', 'Pension', 'Insurance', 'Skill Development', 'Other']
    const filteredSchemes = catalogFallback ? schemes.filter((scheme) => {
        const matchesCategory = activeCategory === 'All schemes' || scheme.category === activeCategory
        const searchText = `${scheme.name} ${scheme.category} ${scheme.audience} ${scheme.description}`.toLowerCase()
        const matchesState = activeState === 'ALL' || !scheme.state || scheme.state === 'ALL' || scheme.state.toLowerCase() === activeState.toLowerCase()
        return matchesCategory && matchesState && searchText.includes(query.trim().toLowerCase())
    }) : schemes
    const pageCount = catalogFallback ? Math.ceil(filteredSchemes.length / schemesPerPage) : pagination.totalPages
    const visibleSchemes = catalogFallback ? filteredSchemes.slice((currentPage - 1) * schemesPerPage, currentPage * schemesPerPage) : schemes
    const otherAssistantSchemes = assistantSuggestions.schemes.filter((scheme) => String(scheme.id || scheme.name) !== selectedAssistantSchemeId)

    const toggleSaved = (schemeId) => {
        setSaved((current) => current.includes(schemeId)
            ? current.filter((id) => id !== schemeId)
            : [...current, schemeId])
    }

    const sendChatMessage = async (textToSend, selectedSchemeId = '', { hideUserMessage = false } = {}) => {
        const text = (textToSend || message).trim()
        if (!text || isLoading) return
        if (!hideUserMessage) {
            setConversation((current) => [...current, { id: `u_${Date.now()}`, role: 'user', content: text }])
        }
        setMessage('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/v1/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    language: aiLanguage,
                    ...(conversationId ? { conversationId } : {}),
                    ...(selectedSchemeId ? { selectedSchemeId } : {}),
                    profile: profileSaved ? toAssistantProfile(profile) : undefined,
                }),
            })
            const payload = await response.json()
            if (!response.ok) throw new Error(payload?.error?.message || `Server returned ${response.status}`)
            if (!payload.success || !payload.data) throw new Error('Invalid assistant response')
            const data = payload.data
            if (data.conversationId) setConversationId(data.conversationId)
            setConversation((current) => [...current, {
                id: data.message?.id || `a_${Date.now()}`,
                role: 'assistant',
                content: data.message?.content || '',
                sources: data.sources || [],
                model: data.model || aiStatus.activeModel,
            }])
        } catch (error) {
            setConversation((current) => [...current, {
                id: `a_fallback_${Date.now()}`,
                role: 'assistant',
                content: `I couldn't get a response from SevaConnect AI (${error.message || 'connection error'}). Please check that the API is running and try again. This message is not an eligibility result.`,
                model: 'AI service unavailable',
                sources: [],
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleFormSubmit = (event) => {
        event.preventDefault()
        sendChatMessage()
    }

    const selectAssistantScheme = (scheme) => {
        setSelectedAssistantSchemeId(String(scheme.id || scheme.name))
        setShowOtherAssistantSchemes(false)
        const prompt = scheme.status === 'UNVERIFIED_CANDIDATE'
            ? 'Summarize only what the imported record says about ' + scheme.name + '. Clearly say this listing is unverified, do not decide or imply that I am eligible, and direct me to check the linked source before relying on it.'
            : profileSaved
            ? 'Explain ' + scheme.name + ' in simple terms. Tell me what it offers, how it may relate to my saved profile, what details I should verify, and how to apply through the official source.'
            : 'Explain ' + scheme.name + ' in simple terms. Tell me what it offers, who it may be for, what details I should verify, and how to apply through the official source.'
        sendChatMessage(prompt, scheme.id, { hideUserMessage: true })
    }

    const askAssistantAboutCatalogueScheme = () => {
        if (!selectedScheme) return
        const scheme = selectedScheme
        setSelectedScheme(null)
        setShowAssistant(true)
        selectAssistantScheme(scheme)
    }

    const clearChat = () => {
        setConversation([])
        setConversationId(null)
        setSelectedAssistantSchemeId('')
        setShowOtherAssistantSchemes(false)
    }

    const copyToClipboard = (text, id) => {
        navigator.clipboard?.writeText(text).then(() => {
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        })
    }

    const closeMobileMenu = () => setMobileMenuOpen(false)

    return (
        <div className="site-shell">
            <PrototypeNotice />
            <SiteHeader mobileMenuOpen={mobileMenuOpen} onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)} onMobileMenuClose={closeMobileMenu} onProfileClick={() => setShowProfile(true)} />
            <SiteSubNav action={<button className="button button-primary button-small" type="button" onClick={() => setShowProfile(true)}>Build my profile <Icon name="arrow" size={14} /></button>} />

            <main>
                <section className="hero-tile" id="home">
                    <div className="hero-copy">
                        <p className="eyebrow">Government schemes and public services</p>
                        <h1>Find support. Know what to do next.</h1>
                        <p className="hero-lead">Search public benefit schemes, review the information you may need, and follow links to official application sources.</p>
                        <div className="hero-actions">
                            <a className="button button-primary" href="#discover">Search schemes</a>
                            <button className="button button-secondary" type="button" onClick={() => setShowAssistant(true)}>Get help understanding a scheme</button>
                        </div>
                        <div className="hero-assurance"><Icon name="shield" size={16} /><span>Scheme matches are informational, not official eligibility decisions.</span></div>
                    </div>
                    <aside className="hero-guide" aria-label="Services available">
                        <h2>What you can do here</h2>
                        <a href="#discover"><span className="guide-number">01</span><span><strong>Find schemes</strong><small>Browse by category or search</small></span><Icon name="arrow" size={16} /></a>
                        <button type="button" onClick={() => setShowProfile(true)}><span className="guide-number">02</span><span><strong>Review your details</strong><small>Create a profile for relevant guidance</small></span><Icon name="arrow" size={16} /></button>
                        <button type="button" onClick={() => setShowAssistant(true)}><span className="guide-number">03</span><span><strong>Understand next steps</strong><small>Ask a question in plain language</small></span><Icon name="arrow" size={16} /></button>
                    </aside>
                </section>

                <section className="discovery-section" id="discover">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">Start with a possibility</p>
                            <h2>Explore support that fits your life.</h2>
                            <p className="section-lead">Browse a few popular starting points, or search across the catalog.</p>
                            <a className="text-link myscheme-catalog-link" href="https://www.myscheme.gov.in/search" target="_blank" rel="noopener noreferrer">Browse the full catalogue on myScheme <Icon name="external" size={14} /></a>
                        </div>
                        <span className="catalog-note">{catalogFallback ? 'Showing the sample catalogue because the server is unavailable' : 'Scheme details are for guidance; verify with the official source'}</span>
                    </div>

                    <div className="discovery-controls">
                        <label className="search-field">
                            <Icon name="search" size={19} />
                            <input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1) }} placeholder="Search by scheme, need, or category" />
                        </label>
                        <label className="search-field" aria-label="Filter schemes by state">
                            <select value={activeState} onChange={(event) => { setActiveState(event.target.value); setCurrentPage(1) }}>
                                <option value="ALL">All states and central schemes</option>
                                {IndianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </label>
                        <div className="category-list" role="group" aria-label="Filter schemes by category">
                            {categories.map((category) => (
                                <button
                                    className={`category-chip${activeCategory === category ? ' is-active' : ''}`}
                                    type="button"
                                    key={category}
                                    onClick={() => { setActiveCategory(category); setCurrentPage(1) }}
                                    aria-pressed={activeCategory === category}
                                >{category}</button>
                            ))}
                        </div>
                    </div>

                    {catalogueLoading ? <div className="empty-state" aria-live="polite">Loading schemes…</div> : (filteredSchemes.length ? (
                        <div className="scheme-grid">
                            {visibleSchemes.map((scheme) => (
                                <article className="scheme-card" key={scheme.id}>
                                    <div className="scheme-heading">
                                        <span className="scheme-category">{scheme.category} · {scheme.state && scheme.state !== 'ALL' ? scheme.state : 'Central'}</span>
                                        <button className={`save-button${saved.includes(scheme.id) ? ' is-saved' : ''}`} type="button" onClick={() => toggleSaved(scheme.id)} aria-label={saved.includes(scheme.id) ? `Remove ${scheme.name} from saved schemes` : `Save ${scheme.name}`} aria-pressed={saved.includes(scheme.id)}>
                                            <Icon name="bookmark" size={18} />
                                        </button>
                                    </div>
                                    <div className="scheme-card-copy">
                                        <p className="scheme-audience">{scheme.audience}</p>
                                        <h3>{scheme.name}</h3>
                                        <p className="scheme-description">{scheme.description}</p>
                                        <button className="text-link" type="button" onClick={() => setSelectedScheme(scheme)}>Explore scheme <Icon name="arrow" size={16} /></button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state"><Icon name="search" size={24} /><h3>No schemes found</h3><p>Try a different search or choose another category.</p><button className="text-link" type="button" onClick={() => { setQuery(''); setActiveCategory('All schemes'); setActiveState('ALL'); setCurrentPage(1) }}>Clear filters</button></div>
                    ))}
                    {!catalogueLoading && pageCount > 1 && <nav className="scheme-pagination" aria-label="Scheme pages">
                        <button className="button button-secondary button-small" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</button>
                        <span aria-live="polite">Page {currentPage} of {pageCount}</span>
                        <button className="button button-secondary button-small" type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount}>Next</button>
                    </nav>}
                    {saved.length > 0 && <p className="saved-count"><Icon name="bookmark" size={15} /> {saved.length} {saved.length === 1 ? 'scheme' : 'schemes'} saved in this session</p>}
                </section>

                <section className="assistant-tile">
                    <div className="assistant-inner">
                        <div className="assistant-copy">
                            <p className="eyebrow eyebrow-dark">A little help goes a long way</p>
                            <h2>Questions are part<br />of the process.</h2>
                            <p>Ask in everyday language. Get a clear explanation of scheme information and what to do next.</p>
                            <button className="button button-primary" type="button" onClick={() => setShowAssistant(true)}>Talk to SevaConnect AI <Icon name="arrow" size={17} /></button>
                        </div>
                        <div className="assistant-preview" aria-label="Example assistant conversation">
                            <div className="preview-label"><span className="online-dot" /> SevaConnect assistant <span className="preview-language">EN</span></div>
                            <div className="preview-message user-message">What should I do before applying?</div>
                            <div className="preview-message assistant-message">Start by checking the official eligibility criteria and gathering the documents listed for your scheme.</div>
                            <p className="preview-footnote">Answers explain information; official authorities make eligibility decisions.</p>
                        </div>
                    </div>
                </section>

                <section className="steps-section" id="how-it-works">
                    <div className="steps-heading">
                        <p className="eyebrow">From discovery to next step</p>
                        <h2>A simpler path, one step at a time.</h2>
                    </div>
                    <div className="steps-grid">
                        <article className="step-item"><span className="step-number">01</span><h3>Tell us what matters</h3><p>Add a few profile details to make discovery more relevant. You choose what to share.</p></article>
                        <article className="step-item"><span className="step-number">02</span><h3>See why it may fit</h3><p>Review the criteria behind each match and spot anything that needs verification.</p></article>
                        <article className="step-item"><span className="step-number">03</span><h3>Prepare with clarity</h3><p>Keep track of documents, next steps, and the official source for each scheme.</p></article>
                    </div>
                    <div className="profile-banner">
                        <div className="profile-banner-icon"><Icon name="user" size={20} /></div>
                        <div><h3>{profileSaved ? 'Your demo profile is ready' : 'A few details can make a difference.'}</h3><p>{profileSaved ? 'Your information is saved in this browser.' : 'Build a profile to see a more relevant starting point.'}</p></div>
                        <button className="button button-secondary" type="button" onClick={() => setShowProfile(true)}>{profileSaved ? 'Edit profile' : 'Build my profile'} <Icon name="arrow" size={16} /></button>
                    </div>
                </section>

                <section className="trust-section" id="trust">
                    <div className="trust-inner">
                        <span className="trust-icon"><Icon name="shield" size={22} /></span>
                        <div><p className="eyebrow">Built for clarity and trust</p><h2>Your information is yours.<br />Your next step stays clear.</h2></div>
                        <p className="trust-description">SevaConnect is an independent prototype, not a government service. Scheme details are for guidance only. Always confirm eligibility, documents, and application steps with the linked official source.</p>
                    </div>
                </section>
            </main>

            <SiteFooter />

            {selectedScheme && (
                <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedScheme(null) }}>
                    <section className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="scheme-dialog-title">
                        <button className="dialog-close" type="button" onClick={() => setSelectedScheme(null)} aria-label="Close scheme details"><Icon name="close" /></button>
                        <p className="eyebrow">{selectedScheme.category} · Scheme overview</p>
                        <h2 id="scheme-dialog-title">{selectedScheme.name}</h2>
                        <p className="dialog-lead">{selectedScheme.description}</p>
                        <div className="dialog-note"><Icon name="shield" size={19} /><p>Eligibility and documents depend on official criteria. This prototype does not make a final eligibility decision.</p></div>
                        <div className="dialog-actions">
                            <button className="button button-primary" type="button" onClick={askAssistantAboutCatalogueScheme}><Icon name="sparkles" size={16} /> Ask SevaConnect AI</button>
                            <a className="button button-secondary" href={selectedScheme.source} target="_blank" rel="noreferrer">Visit official source <Icon name="external" size={15} /></a>
                            <button className="button button-secondary" type="button" onClick={() => { setSelectedScheme(null); setShowProfile(true) }}>Check my profile</button>
                        </div>
                    </section>
                </div>
            )}

            {showProfile && (
                <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowProfile(false) }}>
                    <section className="detail-dialog profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
                        <button className="dialog-close" type="button" onClick={() => setShowProfile(false)} aria-label="Close profile form"><Icon name="close" /></button>
                        <p className="eyebrow">A more relevant starting point</p>
                        <h2 id="profile-dialog-title">Build your profile.</h2>
                        <p className="dialog-lead">Share only what you are comfortable sharing. These details are saved in this browser and sent with your AI questions, but are not saved to an account. Clear this browser's site data to remove them.</p>
                        <form className="profile-form" onSubmit={(event) => {
                            event.preventDefault()
                            setProfileSaved(true)
                            try {
                                window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
                            } catch {
                                // Keep the current session usable if browser storage is unavailable.
                            }
                            setShowProfile(false)
                        }}>
                            <label>State or union territory<input value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })} placeholder="e.g. Maharashtra" required /></label>
                            <label>Age in years<input type="number" min="1" max="120" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} placeholder="e.g. 32" required /></label>
                            <label>Gender<select value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Prefer not to say</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
                            <label>Residence type<select value={profile.residenceType} onChange={(event) => setProfile({ ...profile, residenceType: event.target.value })}><option value="">Select if known</option><option value="RURAL">Rural</option><option value="URBAN">Urban</option></select></label>
                            <label>Social category <span className="profile-optional">Optional</span><select value={profile.category} onChange={(event) => setProfile({ ...profile, category: event.target.value })}><option value="">Prefer not to say</option><option value="GENERAL">General</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option></select></label>
                            <label>Education level <span className="profile-optional">Optional</span><select value={profile.educationLevel} onChange={(event) => setProfile({ ...profile, educationLevel: event.target.value })}><option value="">Prefer not to say</option><option value="NO_FORMAL">No formal schooling</option><option value="PRIMARY">Primary school</option><option value="SECONDARY">Secondary school</option><option value="CLASS_10">Class 10</option><option value="CLASS_12">Class 12</option><option value="DIPLOMA_ITI">Diploma / ITI</option><option value="GRADUATE">Graduate</option><option value="POSTGRADUATE">Postgraduate</option><option value="OTHER">Other</option></select></label>
                            <label>Annual family income (INR)<input type="number" min="0" value={profile.annualFamilyIncome} onChange={(event) => setProfile({ ...profile, annualFamilyIncome: event.target.value })} placeholder="Optional: exact amount" /></label>
                            <label>Or choose an income range <span className="profile-optional">Optional</span><select value={profile.incomeRange} onChange={(event) => setProfile({ ...profile, incomeRange: event.target.value })}><option value="">Prefer not to say</option><option value="UNDER_1L">Below ₹1 lakh</option><option value="1_2_5L">₹1 lakh–₹2.5 lakh</option><option value="2_5_5L">₹2.5 lakh–₹5 lakh</option><option value="5_8L">₹5 lakh–₹8 lakh</option><option value="OVER_8L">Above ₹8 lakh</option></select></label>
                            <label>What best describes you?<select value={profile.occupation} onChange={(event) => setProfile({ ...profile, occupation: event.target.value })} required><option value="" disabled>Select one</option><option value="STUDENT">Student</option><option value="FARMER">Farmer</option><option value="SELF_EMPLOYED">Self-employed</option><option value="EMPLOYED">Employed</option><option value="LOOKING_FOR_WORK">Looking for work</option><option value="OTHER">Other</option></select></label>
                            {profile.occupation === 'FARMER' && <div className="profile-conditional-fields"><p className="profile-section-title">Farmer details <span className="profile-optional">Optional</span></p><label>How do you use the land?<select value={profile.farmerLandAccess} onChange={(event) => setProfile({ ...profile, farmerLandAccess: event.target.value })}><option value="">Prefer not to say</option><option value="OWNED">I own the land</option><option value="LEASED">I lease the land</option><option value="BOTH">I own and lease land</option><option value="LANDLESS">I farm without owning land</option><option value="UNSURE">Not sure</option></select></label><label>Approximate land size<select value={profile.farmerLandSize} onChange={(event) => setProfile({ ...profile, farmerLandSize: event.target.value })}><option value="">Prefer not to say</option><option value="UNDER_1_ACRE">Less than 1 acre</option><option value="1_2_ACRES">1–2 acres</option><option value="2_5_ACRES">2–5 acres</option><option value="OVER_5_ACRES">More than 5 acres</option><option value="UNSURE">Not sure</option></select></label></div>}
                            {profile.occupation === 'SELF_EMPLOYED' && <div className="profile-conditional-fields"><p className="profile-section-title">Business details <span className="profile-optional">Optional</span></p><label>Business stage<select value={profile.businessStage} onChange={(event) => setProfile({ ...profile, businessStage: event.target.value })}><option value="">Prefer not to say</option><option value="PLANNING">Planning to start</option><option value="NEW">Recently started</option><option value="EXISTING">Already running</option></select></label><label>Business type<select value={profile.businessType} onChange={(event) => setProfile({ ...profile, businessType: event.target.value })}><option value="">Prefer not to say</option><option value="MANUFACTURING">Manufacturing</option><option value="SERVICES">Services</option><option value="TRADING">Trading / shop</option><option value="AGRICULTURE_ALLIED">Agriculture-related</option><option value="OTHER">Other</option></select></label></div>}
                            <div className="privacy-note"><Icon name="shield" size={17} /><span>These details are saved in this browser and sent to the configured AI provider when you ask a question. They are not saved to an account. Clear this browser's site data to remove them.</span></div>
                            <button className="button button-primary form-submit" type="submit">Save profile <Icon name="arrow" size={16} /></button>
                        </form>
                    </section>
                </div>
            )}

            {showAssistant && (
                <div className="assistant-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAssistant(false) }}>
                    <section className="assistant-panel" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
                        <header className="assistant-panel-header">
                            <div>
                                <span className="assistant-avatar"><Icon name="sparkles" size={19} /></span>
                                <div><h2 id="assistant-title">SevaConnect AI</h2><p>{aiStatus.activeModel}</p></div>
                            </div>
                            <div className="assistant-header-controls">
                                {conversation.length > 0 && <button className="header-icon-btn" type="button" onClick={clearChat} title="Clear conversation" aria-label="Clear conversation"><Icon name="trash" size={15} /></button>}
                                <button className="dialog-close" type="button" onClick={() => setShowAssistant(false)} aria-label="Close assistant"><Icon name="close" /></button>
                            </div>
                        </header>

                        <div className="assistant-subbar">
                            <span className="model-indicator" title={aiStatus.activeModel}><span className="status-dot-pulse" />{aiStatus.isOpenSource ? 'Open Source AI' : 'AI Online'}</span>
                            <div className="lang-switch-group" role="group" aria-label="Select AI response language">
                                <button type="button" className={`lang-btn${aiLanguage === 'en' ? ' is-active' : ''}`} onClick={() => setAiLanguage('en')}>EN</button>
                                <button type="button" className={`lang-btn${aiLanguage === 'hi' ? ' is-active' : ''}`} onClick={() => setAiLanguage('hi')}>हिन्दी</button>
                                <button type="button" className={`lang-btn${aiLanguage === 'hinglish' ? ' is-active' : ''}`} onClick={() => setAiLanguage('hinglish')}>Hinglish</button>
                            </div>
                        </div>

                        {profileSaved && (profile.state || profile.gender || profile.occupation || profile.age) && <div className="assistant-profile-context"><span>Profile: <strong>{[profile.state, profile.gender, profile.occupation, profile.age].filter(Boolean).join(' · ')}</strong></span><button type="button" className="profile-edit-link" onClick={() => { setShowAssistant(false); setShowProfile(true) }}>Edit</button></div>}

                        <div className="assistant-thread" role="log" aria-live="polite" aria-label="AI conversation" tabIndex="0">
                            {conversation.length === 0 && <div className="assistant-welcome"><p className="eyebrow">Namaste · Hello</p><h3>{assistantSuggestions.personalized && assistantSuggestions.hasMatches ? 'Schemes that may fit your profile' : assistantSuggestions.personalized ? 'Explore these schemes' : 'Choose a scheme to explore'}</h3><p>{assistantSuggestions.personalized && assistantSuggestions.hasMatches ? 'Tap a scheme and I’ll explain why it may be relevant, what to verify, and what to do next.' : assistantSuggestions.personalized ? 'The available rules did not find a clear match, but you can still explore these schemes.' : 'Tap a scheme to see its benefits, documents, and official application steps. You can ask a follow-up question after that.'}</p><div className="assistant-chips-label">{loadingAssistantSuggestions ? 'Finding schemes…' : assistantSuggestions.personalized && assistantSuggestions.hasMatches ? 'Possible matches' : 'Schemes to explore'}</div>{loadingAssistantSuggestions ? <p className="assistant-suggestions-loading">Loading scheme suggestions…</p> : <div className="assistant-scheme-list">{assistantSuggestions.schemes.slice(0, 6).map((scheme) => <button key={scheme.id || scheme.name} type="button" className="assistant-scheme-option" onClick={() => selectAssistantScheme(scheme)} disabled={isLoading}><span className="assistant-scheme-option-copy"><strong>{scheme.name}</strong><span>{scheme.category}{scheme.audience ? ' · ' + scheme.audience : ''}</span>{scheme.status === 'POTENTIALLY_RELEVANT' && <small>Possible match · verify with the official source</small>}</span><Icon name="arrow" size={16} /></button>)}</div>}</div>}
                            {conversation.map((item) => <div className={`chat-msg ${item.role === 'user' ? 'msg-user' : 'msg-assistant'}`} key={item.id}>
                                {item.role === 'user' ? <div className="chat-bubble-user">{item.content}</div> : <div className="chat-bubble-assistant"><div className="markdown-body">{formatMarkdownContent(item.content)}</div>{item.sources?.length > 0 && <div className="chat-sources"><span className="chat-sources-label">{item.sources.some((source) => source.sourceType === 'UNVERIFIED') ? 'Imported source to verify:' : 'Official sources:'}</span>{item.sources.map((source, index) => <a className="source-chip" key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <Icon name="external" size={11} /></a>)}</div>}<div className="chat-msg-footer"><span>{item.model || 'SevaConnect AI'}</span><button type="button" className="copy-btn" onClick={() => copyToClipboard(item.content, item.id)} title="Copy response"><Icon name="copy" size={11} /> {copiedId === item.id ? 'Copied!' : 'Copy'}</button></div></div>}
                            </div>)}
                            {isLoading && <div className="chat-msg msg-assistant"><div className="chat-bubble-assistant"><div className="typing-dots"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div></div></div>}
                            <div ref={threadEndRef} />
                        </div>

                        {conversation.length > 0 && profileSaved && otherAssistantSchemes.length > 0 && <div className="assistant-more-schemes">
                            {showOtherAssistantSchemes && <div className="assistant-more-schemes-popover" id="assistant-more-schemes-list">
                                <strong>Other schemes for your profile</strong>
                                <div className="assistant-more-schemes-options">
                                    {otherAssistantSchemes.map((scheme) => <button key={scheme.id || scheme.name} type="button" className="assistant-scheme-option" onClick={() => selectAssistantScheme(scheme)} disabled={isLoading}>
                                        <span className="assistant-scheme-option-copy"><strong>{scheme.name}</strong><span>{scheme.category}{scheme.audience ? ' · ' + scheme.audience : ''}</span></span>
                                        <Icon name="arrow" size={16} />
                                    </button>)}
                                </div>
                            </div>}
                            <button type="button" className="assistant-more-schemes-trigger" aria-expanded={showOtherAssistantSchemes} aria-controls="assistant-more-schemes-list" onClick={() => setShowOtherAssistantSchemes((open) => !open)}>
                                {showOtherAssistantSchemes ? 'Close scheme list' : 'Explore other schemes for my profile'}
                            </button>
                        </div>}

                        <form className="assistant-compose" onSubmit={handleFormSubmit}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={aiLanguage === 'hi' ? 'योजना के बारे में पूछें...' : aiLanguage === 'hinglish' ? 'Scheme ke baare mein poochhein...' : 'Ask about a scheme, document, or eligibility...'} aria-label="Ask a question" disabled={isLoading} /><button className="button button-primary" type="submit" aria-label="Send message" disabled={!message.trim() || isLoading}><Icon name="arrow" size={18} /></button></form>
                        <p className="assistant-disclaimer">For guidance only. Check every detail with the official source.</p>
                    </section>
                </div>
            )}
        </div>
    )
}

export default App
