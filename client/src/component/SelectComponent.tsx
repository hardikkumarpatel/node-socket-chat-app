import { Combobox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import React, { useEffect, useState } from "react";
import { classNames } from "../Utils";

interface OptionProps {
    value: string;
    label: string
}
interface SelectComponentProps {
    options: OptionProps[];
    value: string;
    placeholder: string;
    onChange: (value: { value: string; label: string }) => void;
}

const SelectComponent: React.FC<SelectComponentProps> = ({ options, value, placeholder, onChange }) => {
    const [localOptions, setLocalOptions] = useState<typeof options>([]);

    useEffect(() => {
        setLocalOptions(options);
    }, [options]);

    return (
        <Combobox
            className={"w-full"}
            as="div"
            value={options.find((o) => o.value === value)}
            onChange={(val: any) => onChange(val)}
        >
            <div className="relative mt-2">
                <Combobox.Button className="w-full">
                    <Combobox.Input
                        placeholder={placeholder}
                        className="block w-full  bg-gray-50  border border-gray-300 rounded-xl py-4 px-5 bg-secondary outline-none text-gray-900 font-light placeholder:text-gray-400  focus:ring-primary-600 focus:border-primary-600"
                        onChange={(e) => {
                            setLocalOptions(
                                options.filter((op) => op.label.includes(e.target.value))
                            );
                        }}
                        displayValue={(option: (typeof options)[0]) => option?.label}
                    />
                </Combobox.Button>
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                    <ChevronUpDownIcon
                        className="h-5 w-5 text-zinc-400"
                        aria-hidden="true"
                    />
                </Combobox.Button>

                {localOptions.length > 0 && (
                    <Combobox.Options className="outline outline-[1px] bg-white absolute z-10 mt-2 p-2 max-h-60 w-full overflow-auto rounded-2xl bg-secondary text-base shadow-lg ring-opacity-5 focus:outline-none sm:text-sm">
                        {localOptions.map((option) => (
                            <Combobox.Option
                                key={option.value}
                                value={option}
                                className={({ active }) =>
                                    classNames(
                                        "cursor-pointer relative rounded-2xl select-none py-4 pl-3 pr-9",
                                        active ? "bg-gray-500 text-gray-300 font-semibold" : "text-gray-500"
                                    )
                                }
                            >
                                {({ active, selected }) =>
                                (<>
                                    <span
                                        className={classNames(
                                            "block truncate",
                                            selected ? "font-extrabold" : ""
                                        )}
                                    >
                                        {option.label}
                                    </span>

                                    {selected && (
                                        <span
                                            className={classNames(
                                                "absolute inset-y-0 right-0 flex items-center pr-4",
                                                active ? "text-white" : "text-gray-500"
                                            )}
                                        >
                                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                    )}
                                </>)
                                }
                            </Combobox.Option>
                        ))}
                    </Combobox.Options>
                )}
            </div>
        </Combobox>
    );
};

export default SelectComponent;
