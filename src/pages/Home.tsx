import React from 'react';
import { Hero } from '../components/home/Hero';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { Newsletter } from '../components/home/Newsletter';

export const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Newsletter />
    </>
  );
};