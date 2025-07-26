import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Feedback {
    name: string;
    message: string;
    image?: string;
    rating?: number;
}

interface CustomerFeedbackProps {
    feedbacks: Feedback[];
    title?: string;
}

const CustomerFeedback: React.FC<CustomerFeedbackProps> = ({ feedbacks, title }) => {
    return (
        <section className="py-12">
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center mb-4">
                {title || 'What Our Customers Say'}
            </h2>
            <div className="w-20 h-1 bg-[#4e9f66] mx-auto mb-10 rounded-full"></div>

            {/* Feedback Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                {feedbacks.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 * index }}
                        viewport={{ once: true }}
                        className="bg-white rounded-xl shadow-lg p-6 text-center transform transition duration-300 hover:scale-105 hover:shadow-xl"
                    >
                        {/* Message */}
                        <p className="text-gray-600 italic mb-4">"{item.message}"</p>

                        {/* Rating */}
                        {item.rating && (
                            <div className="flex justify-center mb-4">
                                {Array.from({ length: item.rating }).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                ))}
                            </div>
                        )}

                        {/* User Info */}
                        <div className="flex flex-col items-center">
                           {/* {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-[#4e9f66]"
                                />
                            )}*/}
                            <span className="font-semibold text-gray-800">{item.name}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default CustomerFeedback;
