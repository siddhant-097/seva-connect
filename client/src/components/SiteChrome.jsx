export function Icon({ name, size = 20 }) {
    const paths = {
        arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
        bookmark: <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" />,
        check: <path d="m5 12 4 4L19 6" />,
        chevron: <path d="m7 10 5 5 5-5" />,
        close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
        globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
        menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
        message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
        search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
        shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
        sparkles: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />,
        trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-.9-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M10 11v6M14 11v6" /></>,
        user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-1.5a7 7 0 0 1 14 0V21" /></>,
        copy: <><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
        external: <><path d="M14 5h5v5" /><path d="m13 11 6-6" /><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
    }

    return (
        <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {paths[name] || paths.message}
        </svg>
    )
}

export function Brand({ href = '#home', onClick }) {
    return (
        <a className="brand" href={href} onClick={onClick} aria-label="SevaConnect home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>seva<span className="brand-light">connect</span></span>
        </a>
    )
}

export function PrototypeNotice({ sectionPrefix = '' }) {
    return (
        <div className="prototype-notice" role="status">
            <div className="prototype-notice-inner"><strong>Independent prototype</strong><span>SevaConnect is not an official government website. Confirm scheme details with the linked government source.</span><a href={`${sectionPrefix}#trust`}>About this service</a></div>
        </div>
    )
}

export function SiteHeader({ mobileMenuOpen, onMobileMenuToggle, onMobileMenuClose, onProfileClick, sectionPrefix = '', homeHref = '#' }) {
    return (
        <header className="global-nav">
            <div className="nav-inner">
                <Brand href={homeHref} onClick={onMobileMenuClose} />
                <nav className={`primary-links${mobileMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
                    <a href={`${sectionPrefix}#discover`} onClick={onMobileMenuClose}>Find schemes</a>
                    <a href={`${sectionPrefix}#how-it-works`} onClick={onMobileMenuClose}>How it works</a>
                    <a href={`${sectionPrefix}#trust`} onClick={onMobileMenuClose}>Our approach</a>
                </nav>
                <div className="nav-actions">
                    <label className="language-picker" aria-label="Choose language">
                        <Icon name="globe" size={16} />
                        <select defaultValue="English" aria-label="Language">
                            <option>English</option>
                            <option>हिन्दी</option>
                            <option>বাংলা</option>
                            <option>தமிழ்</option>
                        </select>
                        <Icon name="chevron" size={13} />
                    </label>
                    {onProfileClick && <button className="nav-profile" type="button" onClick={onProfileClick} aria-label="Open profile"><Icon name="user" size={17} /></button>}
                    <button className="menu-toggle" type="button" onClick={onMobileMenuToggle} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}>
                        <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
                    </button>
                </div>
            </div>
        </header>
    )
}

export function SiteSubNav({ action }) {
    return (
        <div className="sub-nav">
            <div className="sub-nav-inner">
                <span className="sub-nav-title">Benefits navigator</span>
                <span className="sub-nav-note">A clearer way to find support</span>
                {action}
            </div>
        </div>
    )
}

export function SiteFooter({ sectionPrefix = '' }) {
    return (
        <footer className="site-footer">
            <div className="footer-main">
                <div className="footer-brand"><Brand /><p>Helping people find a clearer path<br />to public support.</p></div>
                <div className="footer-links"><span>Explore</span><a href={`${sectionPrefix}#discover`}>Find schemes</a><a href={`${sectionPrefix}#how-it-works`}>How it works</a><a href={`${sectionPrefix}#trust`}>Our approach</a></div>
                <div className="footer-links"><span>Get help</span><a href={`${sectionPrefix}#discover`}>Browse support</a><a href={`${sectionPrefix}#trust`}>Our approach</a><a href="/admin">Admin</a></div>
            </div>
            <div className="footer-legal"><span>© 2026 SevaConnect · Hackathon prototype</span><span>Not an official government website</span></div>
        </footer>
    )
}
