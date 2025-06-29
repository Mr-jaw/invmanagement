# LuxeShowcase - Premium Product Showcase

A modern, full-featured e-commerce showcase built with React, TypeScript, and Supabase. Features a beautiful admin dashboard, customer reviews, and comprehensive analytics.

## 🚀 Features

### Frontend
- **Modern React Architecture** - Built with React 18, TypeScript, and Vite
- **Beautiful UI/UX** - Tailwind CSS with custom design system
- **Dark Mode Support** - Seamless theme switching
- **Responsive Design** - Mobile-first approach
- **Smooth Animations** - Framer Motion for delightful interactions
- **Performance Optimized** - Lazy loading, code splitting, and optimized assets

### Product Management
- **Product Catalog** - Comprehensive product listings with categories
- **Image Galleries** - Multiple product images with carousel navigation
- **Detailed Product Pages** - Specifications, reviews, and related products
- **Search & Filtering** - Advanced product discovery
- **Featured Products** - Highlight premium items

### Admin Dashboard
- **Analytics Dashboard** - Real-time metrics and insights
- **Product Management** - Full CRUD operations for products
- **Category Management** - Organize products efficiently
- **Review Moderation** - Approve and manage customer reviews
- **Contact Management** - Handle customer inquiries
- **Subscriber Management** - Newsletter subscription handling

### Customer Features
- **Product Reviews** - Star ratings and detailed feedback
- **Contact Forms** - Customer support integration
- **Newsletter Signup** - Email subscription system
- **Wishlist & Cart** - Shopping functionality (UI ready)

### Technical Features
- **Supabase Integration** - PostgreSQL database with real-time features
- **Authentication** - Secure admin login system
- **Row Level Security** - Database-level security policies
- **Performance Monitoring** - Real-time performance tracking
- **SEO Optimized** - Meta tags and semantic HTML
- **Accessibility** - WCAG compliant design

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify
- **Monitoring**: Built-in performance monitoring

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luxe-showcase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The project includes comprehensive database migrations in `/supabase/migrations/`:

- **Products Table** - Product catalog with images and specifications
- **Categories Table** - Product categorization
- **Reviews Table** - Customer reviews with ratings
- **Contacts Table** - Customer inquiries
- **Subscriptions Table** - Newsletter subscriptions

All tables include Row Level Security (RLS) policies for secure data access.

## 🔐 Admin Access

Default admin credentials:
- **Email**: admin@luxeshowcase.com
- **Password**: admin123

Access the admin dashboard at `/admin/login`

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Configure redirects**
   The `netlify.toml` file is already configured for SPA routing.

### Environment Variables for Production

```env
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
VITE_APP_ENV=production
```

## 📊 Performance & Monitoring

### Built-in Performance Monitoring
- **Load Time Tracking** - Monitors page load performance
- **Memory Usage** - Tracks JavaScript heap usage
- **Connection Status** - Network connectivity monitoring
- **Real-time Alerts** - Performance issue notifications

### Analytics Dashboard
- **Traffic Analytics** - Page views, unique visitors
- **User Behavior** - Session duration, bounce rate
- **Device Breakdown** - Mobile, desktop, tablet usage
- **Traffic Sources** - Organic, direct, social, referral

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#2563eb to #1d4ed8)
- **Luxury**: Purple gradient (#9333ea to #7c3aed)
- **Accent**: Yellow gradient (#f59e0b to #d97706)

### Typography
- **Headings**: Bold, hierarchical sizing
- **Body**: Readable line heights (150%)
- **UI Text**: Medium weight for clarity

### Components
- **Cards**: Elevated surfaces with hover effects
- **Buttons**: Multiple variants with loading states
- **Forms**: Consistent styling with validation
- **Navigation**: Responsive with mobile-first design

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── home/           # Homepage components
│   ├── layout/         # Layout components
│   ├── monitoring/     # Performance monitoring
│   ├── products/       # Product-related components
│   └── ui/             # Base UI components
├── contexts/           # React contexts
├── lib/                # Utilities and configurations
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   └── ...             # Public pages
└── types/              # TypeScript type definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pexels** - High-quality stock photos
- **Lucide** - Beautiful icon library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service platform
- **Framer Motion** - Animation library

---

Built with ❤️ for premium product showcases