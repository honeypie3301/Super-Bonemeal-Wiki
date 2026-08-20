import React from 'react';

interface UpdatedFrameProps {
  id?: string;
  isUpdated?: boolean;
  children: React.ReactNode;
  className?: string;
  badgeLabel?: string;
}

export const UpdatedFrame: React.FC<UpdatedFrameProps> = ({
  id,
  children,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`rounded-xl border border-[#2b1625] bg-[#140b11] p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
};
