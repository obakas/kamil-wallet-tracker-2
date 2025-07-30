import React from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
    onClick,
    children,
    className = "",
    variant = "default",
    size = "md",
    disabled = false,
    ...props
}) => {
    // Base styles that apply to all buttons
    const baseStyles = "rounded-md font-medium transition-all flex items-center justify-center";

    // Variant styles
    const variantStyles = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-700 hover:bg-gray-100",
        danger: "bg-red-600 text-white hover:bg-red-700",
    };

    // Size styles
    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    // Disabled state
    const disabledStyles = "opacity-50 cursor-not-allowed";

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? disabledStyles : ""
                } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};