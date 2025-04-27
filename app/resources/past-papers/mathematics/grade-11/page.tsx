'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { pastPapers } from '@/data/pastPapers'; // Adjust the import path as necessary
import {
  Download,
  ChevronLeft,
  Search,
  FileText,
  Book,
} from 'lucide-react';

// Fixed values for this page
const GRADE = '11';
const SUBJECT = 'mathematics';
const YEARS = ['2023', '2022', '2021']; // Update this as needed

interface PastPaperEntry {
  title: string;
  url: string;
  grade: string;
  subject: string;
  year: string;
  examType: string; // 'final' or 'midyear'
}

export default function Grade11MathematicsPastPapersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [filteredPapers, setFilteredPapers] = useState<PastPaperEntry[]>([]);

  // Filter the past papers on mount and when search/filter changes
  useEffect(() => {
    const filtered = pastPapers.filter((paper) => {
      return (
        paper.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        paper.grade === GRADE &&
        paper.subject === SUBJECT &&
        (selectedYear ? paper.year === selectedYear : true)
      );
    });

    setFilteredPapers(filtered);
  }, [searchTerm, selectedYear]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Navigation */}
          <div className="mb-8">
            <Link
              href="/resources/past-papers"
              className="inline-flex items-center text-gray-600 hover:text-red-600"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Past Papers
            </Link>
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-navy-blue">Grade {GRADE} Mathematics Past Papers</h1>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search past papers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => setSelectedYear(e.target.value)}
              defaultValue=""
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Results Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Available Papers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPapers.length > 0 ? (
                filteredPapers.map((paper, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-red-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-800">{paper.title}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {paper.year} • {paper.examType}
                          </p>
                        </div>
                      </div>
                      <a
                        href={paper.url}
                        download
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <Book className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No past papers found for Grade {GRADE} Mathematics. Try adjusting your search term.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 