import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import JobListing from '../components/JobListing'
import AppDownload from '../components/AppDownload'
import Footer from '../components/Footer'
import Faq from '../components/Faq'
const Home = () => {
    const location = useLocation()

    useEffect(() => {
        if (location.state?.scrollTo !== 'job-listing') return

        const frame = window.requestAnimationFrame(() => {
            document.getElementById('job-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })

        return () => window.cancelAnimationFrame(frame)
    }, [location.key, location.state])

    return(
        <div>
            <Navbar />
            <Hero />
            <div id="job-listing" className="scroll-mt-24">
                <JobListing isHome />
            </div>
            <Faq />
            <AppDownload />
            <Footer />
        </div>
    )
}
export default Home
