import { useState } from 'react'
import { PrototypeNotice, SiteFooter, SiteHeader, SiteSubNav } from './components/SiteChrome.jsx'

function NotFoundPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const closeMobileMenu = () => setMobileMenuOpen(false)

    return (
        <div className="site-shell not-found-page">
            <PrototypeNotice sectionPrefix="/" />
            <SiteHeader mobileMenuOpen={mobileMenuOpen} onMobileMenuToggle={() => setMobileMenuOpen((open) => !open)} onMobileMenuClose={closeMobileMenu} sectionPrefix="/" homeHref="/" />
            <SiteSubNav action={<a className="button button-primary button-small" href="/#discover">Explore schemes</a>} />

            <section className="not-found-content" aria-labelledby="not-found-title">
                <p className="not-found-code">404 / Page not found</p>
                <h1 id="not-found-title">This path does not lead anywhere yet.</h1>
                <p className="not-found-description">The page may have moved, or the address may be incomplete. Let&apos;s get you back to finding the support you need.</p>
                <div className="not-found-actions">
                    <a className="button button-primary" href="/">Back to SevaConnect</a>
                    <button className="button button-secondary" type="button" onClick={() => window.history.back()}>Go back</button>
                </div>
            </section>

            <SiteFooter sectionPrefix="/" />
        </div>
    )
}

export default NotFoundPage;