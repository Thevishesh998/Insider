import Navbar from '../components/Navbar'
import JobListing from '../components/JobListing'
import Footer from '../components/Footer'

const Jobs = () => (
  <div>
    <Navbar />
    <main className="pt-8"><JobListing /></main>
    <Footer />
  </div>
)

export default Jobs
