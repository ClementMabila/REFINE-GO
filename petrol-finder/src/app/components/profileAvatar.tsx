import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react'; // or any icon library you're using

const colorOptions = ['#2edda2','#3C4142','#ffa8ec', '#ffa9a9', '#ff6bd6', '#a1f480', '#edb1f1', '#a06ee1', '#42433D'];

interface User {
  username: string;
  // Add other user properties if needed
}

export default function ProfileAvatar({ user }: { user: User | null }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [bgColor, setBgColor] = useState('#2edda2'); // default

  interface GetInitials {
    (name: string): string;
  }

  const getInitials: GetInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

  interface User {
    username: string;
    // Add other user properties if needed
  }

  interface ProfileAvatarProps {
    user: User | null;
  }

  const handleColorPick = (color: string): void => {
    setBgColor(color);
    localStorage.setItem('avatarBgColor', color); // ✅ save to localStorage
    setShowColorPicker(false);
  };

  useEffect(() => {
    const savedColor = localStorage.getItem('avatarBgColor');
    if (savedColor) {
      setBgColor(savedColor);
    }
  }, []);


  return (
    <div className="relative w-24 h-24 mx-auto">
      <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <span className="text-white text-[40px] font-semibold">
          {user ? getInitials(user.username) : ""}
        </span>
      </div>

      {/* Edit Icon */}
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-gray-100"
      >
        <Pencil size={16} className="text-gray-700" />
      </button>

      {/* Color Picker Popup */}
      {showColorPicker && (
        <div className="absolute z-10 bottom-[-70px] left-1/2 -translate-x-1/2 bg-white rounded-xl p-2 shadow-lg flex gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              onClick={() => handleColorPick(color)}
              className="w-6 h-6 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
