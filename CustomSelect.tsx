import React, {useEffect, useState, useRef} from 'react';
import {SelectOption} from '../../types/selectOption.type';
import './mikaSelect.scss'
import DifferentColoredPlus from "../../assets/icons/differentColoredPlus.svg";

interface Props {
    name?: string,
    options: Array<SelectOption>,
    setValueFunction?: (name?: string, value?: any) => void;
    setStateFunction?: (value: SelectOption) => void;
    setEntireOptionFunction?: (value: SelectOption) => void;
    value: any,
    placeholder?: string,
    selectWrapperClassName?: string,
    selectClassName?: string,
    children?: any;
    childrenContainerClass?: string;
    idRequired?: boolean;
    required?: boolean;
    requiredMessage?: string;
    showRequiredMessage?: boolean,
    disabled?: boolean
}

const MikaSelect: React.FC<Props> = (props: Props) => {
    const [opened, setOpened] = useState(false)
    const [searchInputLabel, setSearchInputLabel] = useState<string>('')
    const [selectedLabel, setSelectedLabel] = useState<string>(props.value?.label ? props.value?.label : props.placeholder)
    const [showRequiredMessage, setShowRequiredMessage] = useState<boolean>(false)
    const [options, setOptions] = useState<SelectOption[]>(props?.options)

    useEffect(() => {
        setOptions(props?.options)
    }, [props?.options])

    useEffect(() => {
        if (props.value?.label) {
            setSelectedLabel(props.value?.label)
        } else if (props.value?.name) {
            setSelectedLabel(props.value?.name)
        } else {
            setSelectedLabel(props?.placeholder)
        }
    }, [props.value])

    useEffect(() => {
        let tempFilteredOptions = props?.options
        if (searchInputLabel !== '') {
            tempFilteredOptions = tempFilteredOptions.filter((val) => filteringFunction(val, searchInputLabel))
            setOptions(tempFilteredOptions)
        } else {
            setOptions(props?.options)
        }
    }, [searchInputLabel])

    function filteringFunction(selectOption: SelectOption, searchedWord) {
        return selectOption.label.includes(capitalize(searchedWord))
    }

    function capitalize(word: string) {
        let lowerCase = word.toLowerCase()

        return word.charAt(0).toUpperCase() + lowerCase.slice(1)
    }

    function getSelectedOption(option: SelectOption) {
        setSelectedLabel(option.name ? option.name : option.label)

        if (props.setStateFunction) {
            if (props.idRequired) {
                props.setStateFunction({
                    value: option.id
                })
            } else {
                props.setStateFunction({
                    ...props.value,
                    value: option.value
                })
            }
        } else if (props.setEntireOptionFunction) {
            props.setEntireOptionFunction(option)
        } else {
            if (props.idRequired) {
                props.setValueFunction(props.name, {
                    ...props.value,
                    label: option.name,
                    value: option.id
                })
            } else {
                props.setValueFunction(props.name, {
                    ...props.value,
                    label: option.label,
                    value: option.value
                })
            }
        }
        setOpened(false)
    }

    function outsideAlerter(ref) {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                if (props?.required && (!props?.value?.label)) {
                    setShowRequiredMessage(true)
                } else {
                    setShowRequiredMessage(false)
                }
                setOpened(false)
                document.removeEventListener("mousedown", handleClickOutside);

            }
        }

        document.addEventListener("mousedown", handleClickOutside);
    }

    const wrapperRef = useRef(null);

    function clearValue() {
        if (props?.setValueFunction) {
            props?.setValueFunction('', null)
        }
        if (props?.setStateFunction) {
            props?.setStateFunction({
                label: '',
                value: null
            })
        }
        if (props?.setEntireOptionFunction) {
            props?.setEntireOptionFunction({
                label: '',
                value: null
            })
        }
        setSearchInputLabel('')
        setSelectedLabel(props?.placeholder)
    }

    return <div ref={wrapperRef} className={`select-wrapper ${props.selectWrapperClassName}`} onClick={() => {
        outsideAlerter(wrapperRef)
    }}>
        {props.children ? <div className={`children-container ${props.childrenContainerClass}`}>
            {props.children}
        </div> : ''}
        <div className={`select ${props.selectClassName}`}>
            <div className="selected-value-container" onClick={() => {
                if (!props.disabled)
                    setOpened(true)
            }}>
                <p>{selectedLabel}</p>
                {!props.disabled &&
                <svg className={opened ? 'rotatedArrow' : ''} height="10" viewBox="0 0 16 10" width="16">
                    <path d="m226 21 6 6 6-6" fill="none" stroke="#afafb1" strokeLinecap="square" strokeWidth="2"
                          transform="translate(-224 -19)"/>
                </svg>}
            </div>
            {props.value?.label && !props.disabled && <div className="clearValueIcon" onClick={clearValue}>
                <img src={DifferentColoredPlus} className="x-sign"/>
            </div>}
            {opened &&
            <div className="options-container pt-0">
                <div className={'option searchBarContainer'}>
                    <input type="text" value={searchInputLabel} placeholder={'Search'}
                           onChange={(inputOnChangeEvent: React.ChangeEvent<HTMLInputElement>) => {
                               setSearchInputLabel(inputOnChangeEvent.target.value)
                           }} autoComplete={'off'}/>
                </div>
                {options.length > 0 ? options?.map((option, index) => {
                    return (
                        <p key={index} onClick={() => getSelectedOption(option)}
                           className={`option ${selectedLabel === option.label ? 'selectedOption' : ''}`}>{option.name ? option.name : option.label}</p>
                    )
                }) : <p className="option text-center">Nuk ka te dhena</p>}
            </div>
            }
            {(showRequiredMessage || props.showRequiredMessage) && !props.value?.label &&
            <p className={'requiredMessage errorMessage'}>{props.requiredMessage}</p>}
        </div>
    </div>

}

export default MikaSelect