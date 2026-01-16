import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { optimizeImage } from '../utils/optimizeImage';

export default function CustomDesignsPage() {
  return (
    <div className="min-h-screen content-offset" style={{ background: 'linear-gradient(135deg, #f0fdf9 0%, #fdf9efff 100%)' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="section-title-themed font-extrabold inline-block">
            <span className="text-brand">Custom</span>
            <span className="text-accent"> Designs</span>
          </h1>
          <p className="section-subtitle mt-3">Create one-off designs tailored to your preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Canvas Prints', to: '/shop?category=Canvas Prints', img: 'hero.jpg' },
            { label: 'Neon Signs', to: '/lighting', img: 'owlmobile.jpg' },
            { label: 'Round Canvas', to: '/shop?layout=Circle', img: 'circle.jpeg' },
            { label: 'Skateboard Wall Art', to: '/shop?search=skateboard', img: '3.jpg' },
          ].map((item, idx) => (
            <Link key={idx} to={item.to} className="home-card">
              <div className="rounded-2xl overflow-hidden shadow-md">
                <ImageWithFallback src={optimizeImage(`/src/assets/${item.img}`, 800)} alt={item.label} className="w-full h-56 object-cover" />
              </div>
              <div className="mt-3 text-center font-semibold text-brand">{item.label}</div>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-brand">How it works</h2>
          <ol className="list-decimal pl-6 text-gray-700">
            <li>Upload your high-resolution file</li>
            <li>Add instructions for the design</li>
            <li>Review & finalize the mockup we share</li>
            <li>Extra detailed work may incur an additional cost</li>
          </ol>
          <div className="text-sm text-gray-600">Custom items are non-returnable except for damage/defect. We replace immediately if there is an issue.</div>
        </div>
      </div>
    </div>
  );
}
