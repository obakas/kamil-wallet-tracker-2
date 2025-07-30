import React from "react";

type ButtonProps = {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
};

export const Button: React.FC<ButtonProps> = ({ onClick, children, className }) => (
    <button
        onClick={onClick}
        className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all ${className}`}
    >
        {children}
    </button>
);
