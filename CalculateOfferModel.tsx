mport React, {useEffect, useState} from 'react';
import './calculateOfferModal.scss'
import {EInputTextType, Input} from '../../../components/Input/Input'
import PlusIconLink from '../../../assets/icons/plus.svg'
import FileIcon from '../../../assets/icons/file-text.svg'
import {FormattedMessage, injectIntl} from 'react-intl'
import Product from './Product'
import {withRouter} from 'react-router';
import {RootState} from '../../../reducers';
import {connect} from 'react-redux';
import {Dispatch, bindActionCreators} from 'redux';
import * as actions from '../../../actions/generalActions';
import * as offerActions from '../../../actions/offers';
import {OfferProduct} from '../../../types/offerProduct.type'
import {Button} from '../../../components/Button'
import ReactToPrint from 'react-to-print';
import {PrintedContent} from './PrintedContent';
import {useRef} from 'react'
import ArticleListAndCreateForm from '../../Admin/Article/ArticleListAndCreateForm'
import xSign from '../../../assets/icons/xSign.svg'
import * as Yup from "yup";
import * as validationConfigs from '../../../utils/validationConfigs';
import FormikFormWrapper from '../../../components/FormikFormWrapper/FormikFormWrapper'
import {axiosCaller} from "../../../utils/apiCaller";
import Spinner from "../../../components/Spinner";
import {toFixedNumber} from '../../../utils/react'
import Tooltip from 'rc-tooltip';
import {ModalContent} from '../../../types/modalContent.type';
import {formatDate} from '../../../utils/variableEvaluation';
import moment from "moment";
import {toast} from "react-toastify";

interface Props {
    history: any;
    offers: any;
    offerActions: any;
    client: any;
    actions: any;
    intl: any;
    location: any;
    closeModalFunction: (boolean) => void
}

const CalculateOfferModal = (props: Props) => {
    const componentRef = useRef();

    const [firstAndLastName, setFirstAndLastName] = useState<string>()
    const [date, setDate] = useState(new Date())
    const [fiscalNumber, setFiscalNumber] = useState<number>()
    const [address, setAddress] = useState<string>()
    const [offerId, setOfferId] = useState<string>()
    const [accountNumber, setAccountNumber] = useState<number>()
    const [products, setProducts] = useState<OfferProduct[]>([{} as OfferProduct])
    const [comment, setComment] = useState<string>()
    const [total, setTotal] = useState<number>()
    const [productsLoading, setProductsLoading] = useState<boolean>(false)
    const [articleCreationModalOpened, setArticleCreationModalOpened] = useState<boolean>(false)
    const [initialValues] = useState({
        firstAndLastName: '',
        offer: '',
    })
    const [updatedStartDate, setUpdatedStartDate] = useState()
    const [updateStartDatePayload, setUpdateStartDatePayload] = useState({
        startDate: '',
        articleId: '',
        productId: '',
        quantity: ''
    })

    useEffect(() => {
        props.actions.fetchArticles()
        setFirstAndLastName(props.client?.client?.firstnameAndLastname)
        setFiscalNumber(props.client?.client?.fiscalNumber)
        setAddress(props.client?.client?.address)
        setOfferId(props.offers?.offerClient?.offerId || props.offers?.offerClient?.id)
        setAccountNumber(props.client?.client?.bankAccountNumber)
        setComment(props.offers.offerClient.comment ? props.offers.offerClient.comment : props.offers.comment)
        setTotal(props.offers?.offerClient?.offer_total_calculation)
    }, [])

    const clientOffer: ModalContent = {
        firstAndLastName,
        date,
        fiscalNumber,
        address,
        invoiceNumber: offerId,
        accountNumber,
        products,
        comment,
        offerTotalCalculation: total
    }

    useEffect(() => {
        getProductsOfClient()
    }, [props.offers?.offerClient])

    function getProductsOfClient() {
        let tempProducts = []
        if (props.client?.client?.id) {
            setProductsLoading(true)
            axiosCaller('GET', `products/clients/${props.client?.client?.id}${props.offers?.offerClient?.id ? `?offerId=${props.offers?.offerClient?.id}` : ``}`).then((res) => {
                tempProducts = res.data.data
                if (tempProducts.length !== 0) {
                    setProducts(tempProducts)
                } else {
                    setProducts(
                        [{
                            designation: {
                                label: '',
                                value: 0
                            },
                            discount: 0,
                            price: 0,
                            tax: 0,
                            taxPrice: 0,
                            type: '',
                            unit: 0,
                            value: 0
                        }]
                    )
                }
                setProductsLoading(false)
            }).catch(() => setProductsLoading(false));
        }
    }

    const saveOffer = () => {
        let typesArray = []
        let taxArray = []
        let taxPriceArray = []
        let priceArray = []
        let productUnitArray = []
        let discountArray = []
        let designationArray = []
        let startArray = []
        products.forEach((product) => {
            typesArray.push(product.type)
            taxArray.push(product.tax)
            taxPriceArray.push(product.taxPrice)
            priceArray.push(product.price)
            productUnitArray.push(product.unit)
            discountArray.push(product.discount)
            designationArray.push(product.designation)
            startArray.push(product.start)
        })

        props.offerActions.setNameSurnameOffer(firstAndLastName)
        props.offerActions.setDateOffer(formatDate(date))
        props.offerActions.setFiscalNumberOffer(fiscalNumber)
        props.offerActions.setAddress(address)
        props.offerActions.setOfferId(offerId)
        props.offerActions.setAccountNumber(accountNumber)
        props.offerActions.setTypes(typesArray)
        props.offerActions.setTax(taxArray)
        props.offerActions.setTaxPrice(taxPriceArray)
        props.offerActions.setDesignation(designationArray)
        props.offerActions.setDiscount(discountArray)
        props.offerActions.setProductUnit(productUnitArray)
        props.offerActions.setStartDate(startArray)
        props.offerActions.setPrice(priceArray)
        props.offerActions.setProducts(products)
        props.offerActions.setComment(comment)
        props.closeModalFunction(false)
    }

    const addEmptyOfferProduct = () => {
        let temporaryProductsCopy = [...products]

        temporaryProductsCopy.push({
            designation: {
                label: '',
                value: 0
            },
            discount: 0,
            price: 0,
            tax: 0,
            taxPrice: 0,
            type: '',
            unit: 0,
            value: 0
        })
        setProducts(temporaryProductsCopy)
        props.offerActions.setProducts(products)
    }

    useEffect(() => {
        let allProductTotalPrice = 0
        if (products) {
            products.forEach((product) => {
                if (product.totalPrice) {
                    allProductTotalPrice += Number(product.totalPrice)
                }
            })
        }
        setTotal(allProductTotalPrice)
    }, [products])

    function validationScheme() {
        return Yup.object().shape({
            firstAndLastName: validationConfigs.NAME_SURNAME_VALIDATION,
            offer: validationConfigs.PRODUCTS_VALIDATION,
        });
    }

    function saveStartDate() {
        if (!updatedStartDate) {
            toast.error('Ju lutem mbushni daten e fillimit')
            return
        }
        let payload = {
            ...updateStartDatePayload,
            startDate: moment(updatedStartDate).format('YYYY-MM-DD')
        }
        axiosCaller('POST', `products/update-start-date`, payload).then((res) => {
            console.log(res)
            if (res.data.message) {
                toast.success('Data e fillimit u ndryshua me sukses')
                setUpdateStartDatePayload({
                    startDate: '',
                    articleId: '',
                    productId: '',
                    quantity: ''
                })
                getProductsOfClient()
            } else {
                toast.error('Ato data jane te zena ne prodhim!')
            }
        })
    }

    return (
        <div className="calculate-offer-modal-background">
            <div className="card position-relative">
                <div className="d-flex justify-content-between position-relative">
                    <h1 className="modal-title">
                        <FormattedMessage id="table.nameSurname" defaultMessage="KRIJO OFERTE TE RE"/>
                    </h1>
                    <div className="d-flex print-doc align-items-center print-container">
                        <Tooltip
                            placement="right"
                            overlay={
                                <span>
                                    <FormattedMessage id="app.clearForm"
                                                      defaultMessage="Ruaj se pari oferten pastaj printo"/>
                                </span>
                            }>
                            <ReactToPrint
                                trigger={() => <button disabled={props.offers.length > 0}
                                                       className="printButton d-flex align-items-center">
                                    <img src={FileIcon} alt="" className="mx-2"/>
                                    <p className="m-0">
                                        <FormattedMessage id="app.table.nameSurname"
                                                          defaultMessage="Printo dokumentin"/>
                                    </p>
                                </button>}
                                content={() => componentRef.current}
                            />
                        </Tooltip>
                        <PrintedContent
                            offer={clientOffer}
                            message={props.offers.offerMessage}
                            ref={componentRef}
                        />
                    </div>
                    <div className="x-sign" onClick={() => props.closeModalFunction(false)}>
                        <img src={PlusIconLink} alt="plus icon link"/>
                    </div>
                </div>
                <FormikFormWrapper initialValues={initialValues} validationScheme={validationScheme()}
                                   onSubmit={saveOffer}>
                    <div>
                        <div>
                            <div>
                                <p className="list-title">
                                    <FormattedMessage id="table.nameSurname" defaultMessage="Konsumatori"/>
                                </p>
                            </div>
                            <div className='input-container'>
                                <Input
                                    name="firstAndLastName"
                                    label="label"
                                    id="commentsInput"
                                    value={firstAndLastName || ''}
                                    defaultValue=''
                                    type="text"
                                    disabled
                                    inputTextType={EInputTextType.SimpleInput}>
                                    <FormattedMessage id="table.nameSurname" defaultMessage="Emri dhe mbiemri *"/>
                                </Input>
                                <Input
                                    name="date"
                                    value={date || ''}
                                    type="date"
                                    disabled
                                    inputWrapperClass={`simple-date-input mt-0 heightFitContent ${date ? " " : 'does-not-have-data'}`}>
                                    <FormattedMessage id="client.scanDocument" defaultMessage="Data e ofertes *"/>
                                </Input>
                                <Input
                                    name="fiscalNumber"
                                    label="label"
                                    id="commentsInput"
                                    value={fiscalNumber || ''}
                                    type="text"
                                    disabled
                                    inputTextType={EInputTextType.SimpleInput}>
                                    <FormattedMessage id="table.fiscalNumber" defaultMessage="Nr. fiskal *"/>
                                </Input>
                                <Input
                                    name="address"
                                    label="label"
                                    id="commentsInput"
                                    value={address || ''}
                                    defaultValue=''
                                    type="text"
                                    disabled
                                    inputTextType={EInputTextType.SimpleInput}>
                                    <FormattedMessage id="table.address" defaultMessage="Adresa *"/>
                                </Input>
                                <Input
                                    name="offerId"
                                    label="label"
                                    id="commentsInput"
                                    value={offerId || ''}
                                    defaultValue=''
                                    type="text"
                                    onChange={(name, value) => setOfferId(value)}
                                    inputTextType={EInputTextType.SimpleInput}>
                                    <FormattedMessage id="app.table.offerId" defaultMessage="Nr. Ofertes *"/>
                                </Input>
                                <Input
                                    name="accountNumber"
                                    label="label"
                                    id="commentsInput"
                                    value={accountNumber || ''}
                                    defaultValue=''
                                    type="text"
                                    disabled
                                    inputTextType={EInputTextType.SimpleInput}>
                                    <FormattedMessage id="table.account" defaultMessage="Llogaria bankare *"/>
                                </Input>
                            </div>
                        </div>
                        <div className="d-flex w-100 justify-content-start py-3">
                            <div className="d-flex" onClick={() => setArticleCreationModalOpened(true)}>
                                <h1 className="m-0 add-product">
                                    <FormattedMessage id="table.addProduct" defaultMessage="SHTO ARTIKULLIN"/>
                                </h1>
                                <img src={PlusIconLink} alt="plus icon link" className="mx-3"/>
                            </div>
                        </div>
                        {articleCreationModalOpened && <div className="card create-article-modal">
                            <div className="cursor-pointer" onClick={() => setArticleCreationModalOpened(false)}>
                                <img src={xSign} alt=""/>
                            </div>
                            <ArticleListAndCreateForm/>
                        </div>}
                        {productsLoading ? <Spinner/> :
                            <div>
                                {products && products?.map((product, index) => (
                                    <Product data={product} getProductsOfClient={getProductsOfClient}
                                             setUpdateStartDatePayload={setUpdateStartDatePayload}
                                             products={products} setProducts={setProducts}
                                             indexWhereThisProductIsPlacedInTheArray={index} key={index}
                                    />
                                ))}
                            </div>
                        }
                        <div>
                            <div className="d-flex w-100 justify-content-start py-3">
                                <div className="d-flex" onClick={addEmptyOfferProduct}>
                                    <h1 className="m-0 add-product">
                                        <FormattedMessage id="table.addProduct" defaultMessage="SHTO PRODUKTIN"/>
                                    </h1>
                                    <img src={PlusIconLink} alt="plus icon link" className="mx-3"/>
                                </div>
                            </div>
                            <div className='input-container comment-section row'>
                                <Input
                                    name="comment"
                                    label="label"
                                    inputWrapperClass='col-10 note'
                                    id="commentsInput"
                                    value={comment || ''}
                                    onChange={(name, value) => setComment(value)}
                                    defaultValue=''
                                    type="text"
                                    inputTextType={EInputTextType.SimpleInput}
                                >
                                    <span className="font-weight-bold">
                                        <FormattedMessage id="table.notice" defaultMessage="Verejtje"/>
                                    </span>
                                </Input>
                                <Input
                                    name="comments"
                                    label="label"
                                    inputWrapperClass='col-2'
                                    id="commentsInput"
                                    value={(total && toFixedNumber(total, 2)) || ''}
                                    onChange={(name, value) => setTotal(value)}
                                    defaultValue=''
                                    type="number"
                                    inputTextType={EInputTextType.SimpleInput}
                                    disabled
                                >
                                    <span className="font-weight-bold">
                                        <FormattedMessage id="table.total" defaultMessage="Totali"/>
                                    </span>
                                </Input>
                            </div>
                        </div>
                        <div className="d-flex justify-content-end w-100 button-container">
                            <Button
                                // submit={true}
                                onClick={saveOffer}
                                className="w-25 align-items-center mb-4 px-3 text-center calculateOfferButton">
                                <FormattedMessage id="offer.saveOffer" defaultMessage="Ruaj Oferten"/>
                            </Button>
                        </div>
                    </div>
                </FormikFormWrapper>
            </div>
            {updateStartDatePayload?.productId && <div className={'updateStartDateModalContainer'}>
                <div className={'updateStartDateModal'}>
                    <Input
                        name="date"
                        value={updatedStartDate || ''}
                        type="date"
                        onChange={(name, value) => setUpdatedStartDate(value)}
                        inputWrapperClass={`simple-date-input heightFitContent ${updatedStartDate ? " " : 'does-not-have-data'}`}>
                        <FormattedMessage id="client.scanDocument" defaultMessage="Data e fillimit *"/>
                    </Input>
                    <Button
                        onClick={saveStartDate}
                        className="saveStartDateButton calculateOfferButton">
                        <FormattedMessage id="offer.saveOffer" defaultMessage="Ruaj daten e fillimit"/>
                    </Button>
                    <Button
                        onClick={() => setUpdateStartDatePayload({
                            startDate: '',
                            articleId: '',
                            productId: '',
                            quantity: ''
                        })}
                        className="saveStartDateButton calculateOfferButton">
                        <FormattedMessage id="offer.saveOffer" defaultMessage="Anulo"/>
                    </Button>
                </div>
            </div>}
        </div>
    )
}


function mapGlobalStateToProps(state: RootState, ownProps: any) {
    return {
        ...ownProps,
        ...state.app,
        client: state.client,
        offers: state.offers
    }
}

function mapDispatchToProps(dispatch: Dispatch<actions.ACTION>) {
    return {
        offerActions: bindActionCreators(offerActions as any, dispatch),
        actions: bindActionCreators(actions as any, dispatch),
    }
}

export default withRouter(connect(mapGlobalStateToProps, mapDispatchToProps)(injectIntl(CalculateOfferModal as any)));
