import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'
import { Icon, PrototypeNotice, SiteFooter, SiteHeader, SiteSubNav } from './components/SiteChrome.jsx'

const schemes = [
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
    { id: 'ladli-behna', name: 'Ladli Behna Yojana', category: 'Women', audience: 'For eligible women in Madhya Pradesh', description: 'Check the state program information and its current application guidance.', source: 'https://cmladlibahna.mp.gov.in/', mark: '09' },
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

const categories = ['All schemes', ...new Set(schemes.map((scheme) => scheme.category))]
const schemesPerPage = 6

const quickPrompts = [
    { label: 'PM-KISAN eligibility', query: 'Am I eligible for PM-KISAN and what documents do I need?' },
    { label: 'Ayushman Bharat cover', query: 'How does Ayushman Bharat PM-JAY health coverage work?' },
    { label: 'Housing assistance', query: 'What are the rules and process for PM Awas Yojana?' },
    { label: 'Student scholarships', query: 'What scholarships are available for students?' },
]

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

function App() {
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('All schemes')
    const [currentPage, setCurrentPage] = useState(1)
    const [saved, setSaved] = useState([])
    const [selectedScheme, setSelectedScheme] = useState(null)
    const [showProfile, setShowProfile] = useState(false)
    const [showAssistant, setShowAssistant] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profile, setProfile] = useState({
        state: '',
        age: '',
        gender: '',
        residenceType: '',
        annualFamilyIncome: '',
        occupation: '',
    })
    const [profileSaved, setProfileSaved] = useState(false)
    const [message, setMessage] = useState('')
    const [conversation, setConversation] = useState([])
    const [conversationId, setConversationId] = useState(null)
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
        if (showAssistant) threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation, isLoading, showAssistant])

    const filteredSchemes = schemes.filter((scheme) => {
        const matchesCategory = activeCategory === 'All schemes' || scheme.category === activeCategory
        const searchText = `${scheme.name} ${scheme.category} ${scheme.audience} ${scheme.description}`.toLowerCase()
        return matchesCategory && searchText.includes(query.trim().toLowerCase())
    })
    const pageCount = Math.ceil(filteredSchemes.length / schemesPerPage)
    const visibleSchemes = filteredSchemes.slice((currentPage - 1) * schemesPerPage, currentPage * schemesPerPage)

    const toggleSaved = (schemeId) => {
        setSaved((current) => current.includes(schemeId)
            ? current.filter((id) => id !== schemeId)
            : [...current, schemeId])
    }

    const sendChatMessage = async (textToSend) => {
        const text = (textToSend || message).trim()
        if (!text || isLoading) return
        setConversation((current) => [...current, { id: `u_${Date.now()}`, role: 'user', content: text }])
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
                    profile: profileSaved ? {
                        ...profile,
                        age: Number(profile.age),
                        annualFamilyIncome: profile.annualFamilyIncome === '' ? undefined : Number(profile.annualFamilyIncome),
                        isFarmer: profile.occupation === 'FARMER',
                        isStudent: profile.occupation === 'STUDENT',
                    } : undefined,
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

    const clearChat = () => {
        setConversation([])
        setConversationId(null)
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
                        </div>
                        <span className="catalog-note">Sample catalog · Always verify details with the official source</span>
                    </div>

                    <div className="discovery-controls">
                        <label className="search-field">
                            <Icon name="search" size={19} />
                            <input value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1) }} placeholder="Search by scheme, need, or category" />
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

                    {filteredSchemes.length ? (
                        <div className="scheme-grid">
                            {visibleSchemes.map((scheme) => (
                                <article className="scheme-card" key={scheme.id}>
                                    <div className="scheme-heading">
                                        <span className="scheme-category">{scheme.category}</span>
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
                        <div className="empty-state"><Icon name="search" size={24} /><h3>No schemes found</h3><p>Try a different search or choose another category.</p><button className="text-link" type="button" onClick={() => { setQuery(''); setActiveCategory('All schemes'); setCurrentPage(1) }}>Clear filters</button></div>
                    )}
                    {pageCount > 1 && <nav className="scheme-pagination" aria-label="Scheme pages">
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
                        <div><h3>{profileSaved ? 'Your demo profile is ready' : 'A few details can make a difference.'}</h3><p>{profileSaved ? 'Your information stays in this browser session.' : 'Build a profile to see a more relevant starting point.'}</p></div>
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
                            <a className="button button-primary" href={selectedScheme.source} target="_blank" rel="noreferrer">Visit official source <Icon name="external" size={15} /></a>
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
                        <p className="dialog-lead">Share only what you are comfortable sharing. These details stay in this browser session and are sent with your AI questions, but are not saved to your account.</p>
                        <form className="profile-form" onSubmit={(event) => { event.preventDefault(); setProfileSaved(true); setShowProfile(false) }}>
                            <label>State or union territory<input value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })} placeholder="e.g. Maharashtra" required /></label>
                            <label>Age in years<input type="number" min="1" max="120" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} placeholder="e.g. 32" required /></label>
                            <label>Gender<select value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}><option value="">Prefer not to say</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
                            <label>Residence type<select value={profile.residenceType} onChange={(event) => setProfile({ ...profile, residenceType: event.target.value })}><option value="">Select if known</option><option value="RURAL">Rural</option><option value="URBAN">Urban</option></select></label>
                            <label>Annual family income (INR)<input type="number" min="0" value={profile.annualFamilyIncome} onChange={(event) => setProfile({ ...profile, annualFamilyIncome: event.target.value })} placeholder="Optional" /></label>
                            <label>What best describes you?<select value={profile.occupation} onChange={(event) => setProfile({ ...profile, occupation: event.target.value })} required><option value="" disabled>Select one</option><option value="STUDENT">Student</option><option value="FARMER">Farmer</option><option value="SELF_EMPLOYED">Self-employed</option><option value="EMPLOYED">Employed</option><option value="LOOKING_FOR_WORK">Looking for work</option><option value="OTHER">Other</option></select></label>
                            <div className="privacy-note"><Icon name="shield" size={17} /><span>These details stay in this browser session and are sent to the configured AI provider when you ask a question. They are not saved as your Atlas profile.</span></div>
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

                        {profileSaved && (profile.state || profile.occupation || profile.age) && <div className="assistant-profile-context"><span>Profile: <strong>{[profile.state, profile.occupation, profile.age].filter(Boolean).join(' · ')}</strong></span><button type="button" className="profile-edit-link" onClick={() => { setShowAssistant(false); setShowProfile(true) }}>Edit</button></div>}

                        <div className="assistant-thread" role="log" aria-live="polite" aria-label="AI conversation" tabIndex="0">
                            {conversation.length === 0 && <div className="assistant-welcome"><p className="eyebrow">Namaste · Hello</p><h3>What would you like to understand?</h3><p>Ask about scheme details, documents, or where to apply. I can explain information, not make official eligibility decisions.</p><div className="assistant-chips-label">Popular starting questions</div><div className="assistant-chips">{quickPrompts.map((prompt) => <button key={prompt.query} type="button" className="prompt-chip" onClick={() => sendChatMessage(prompt.query)}>{prompt.label}</button>)}</div></div>}
                            {conversation.map((item) => <div className={`chat-msg ${item.role === 'user' ? 'msg-user' : 'msg-assistant'}`} key={item.id}>
                                {item.role === 'user' ? <div className="chat-bubble-user">{item.content}</div> : <div className="chat-bubble-assistant"><div className="markdown-body">{formatMarkdownContent(item.content)}</div>{item.sources?.length > 0 && <div className="chat-sources"><span className="chat-sources-label">Official sources:</span>{item.sources.map((source, index) => <a className="source-chip" key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <Icon name="external" size={11} /></a>)}</div>}<div className="chat-msg-footer"><span>{item.model || 'SevaConnect AI'}</span><button type="button" className="copy-btn" onClick={() => copyToClipboard(item.content, item.id)} title="Copy response"><Icon name="copy" size={11} /> {copiedId === item.id ? 'Copied!' : 'Copy'}</button></div></div>}
                            </div>)}
                            {isLoading && <div className="chat-msg msg-assistant"><div className="chat-bubble-assistant"><div className="typing-dots"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div></div></div>}
                            <div ref={threadEndRef} />
                        </div>

                        <form className="assistant-compose" onSubmit={handleFormSubmit}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={aiLanguage === 'hi' ? 'योजना के बारे में पूछें...' : aiLanguage === 'hinglish' ? 'Scheme ke baare mein poochhein...' : 'Ask about a scheme, document, or eligibility...'} aria-label="Ask a question" disabled={isLoading} /><button className="button button-primary" type="submit" aria-label="Send message" disabled={!message.trim() || isLoading}><Icon name="arrow" size={18} /></button></form>
                        <p className="assistant-disclaimer">For guidance only. Check every detail with the official source.</p>
                    </section>
                </div>
            )}
        </div>
    )
}

export default App
