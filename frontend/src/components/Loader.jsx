import React from 'react';
import { ImSpinner2 } from "react-icons/im";

function Loader() {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <ImSpinner2 className="animate-spin text-3xl text-blue-500" />
        </div>
    );
}

export default Loader;
