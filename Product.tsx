import {EInputTextType, Input} from '../../../components/Input/Input';
import {OfferProduct} from '../../../types/offerProduct.type';
import {useEffect, useState} from 'react';
import './calculateOfferModal.scss';
import {FormattedMessage, injectIntl} from 'react-intl';
import {withRouter} from 'react-router';
import {RootState} from '../../../reducers';
import {connect} from 'react-redux';
import {bindActionCreators, Dispatch} from 'redux';
import * as actions from '../../../actions/generalActions';
import * as offerActions from '../../../actions/offers';
import * as adminActions from '../../../actions/admin';
import DifferentColoredPlus from '../../../assets/icons/differentColoredPlus.svg';
import MikaSelect from '../../../components/BbrosSelect/mikaSelect.component';
import {ArticleInfomation} from '../../../types/ArticleInformation.type';
import {axiosCaller} from '../../../utils/apiCaller';
import {SelectOption} from '../../../types/selectOption.type';
import {Button} from '../../../components/Button'
import {toast} from "react-toastify";
import { formatNumberPrice, toFixedNumber } from '../../../utils/react';
import { formatDate } from '../../../utils/variableEvaluation';
interface Props {
    data?: OfferProduct;
    offers: any;
    offerActions: any;
    indexWhereThisProductIsPlacedInTheArray: number,
    products: OfferProduct[];
    setProducts?: (value: OfferProduct[] | ((prevVar: OfferProduct[]) => OfferProduct[])) => void;
    articles: ArticleInfomation[];
    intl: any;
    adminActions: any;
    admin: any;
    client: any;
    getProductsOfClient?: () => void,
    setUpdateStartDatePayload?: (any) => void
}
const Product = (props: Props) => {
    
    const [product, setProduct] = useState<OfferProduct>({} as OfferProduct);
    const [calculatedTotalProductPrice, setCalculatedTotalProductPrice] = useState<number>(0);
    const [productTaxPrice, setProductTaxPrice] = useState<number>(0);
    const [selectedUnitName, setSelectedUnitName] = useState<number>();
    const [selectedWarehouseQuantity, setSelectedWarehouseQuantity] = useState<number>();
    const [selectedUnitId, setSelectedUnitId] = useState<number>();
    const [productCode, setProductCode] = useState<string>();
    const [ articleId, setArticleId ] = useState<number>();
    const [ forProduction, setForProduction ] = useState<boolean>(true)
    useEffect(() => {
        setProduct({
            ...props.data,
        });
    }, []);
    useEffect(()=>{
        if(product?.designation?.value){
            axiosCaller('GET', `articles/${product?.designation?.value}/responsibilities`).then((res) => {
                setSelectedUnitName(res.data?.data?.unit?.name);
                setSelectedUnitId(res.data?.data?.unit?.id);
                setSelectedWarehouseQuantity(res.data?.data?.warehouse?.quantity)
                setProductCode(res.data?.data?.productCode);
            });
        }
    }, [product?.designation])
    const handleChange = (name, value) => {
        setProduct({
            ...product,
            totalPrice: calculatedTotalProductPrice,
            taxPrice: productTaxPrice,
            [name]: value,
        });
    };
    const removeProduct = (index: number) => {
        let productsCopy = [...props.products];
        productsCopy.splice(index, 1);
        props.setProducts(productsCopy);
        axiosCaller('DELETE', `products/${product.id}`).then((res) => {
            if(res.data.data === true){
                toast.success('Produkti u fshi me sukses!')
                props.getProductsOfClient()
            }
        });
    };
    useEffect(() => {
        let allProductsCopy = [...props.products];
        let discountedPrice = Number(product.price) - (Number(product.price) * (Number(product.discount) / 100));
        let taxPrice = discountedPrice + (discountedPrice * (product.tax / 100));
        let totalProductPrice = Number(taxPrice) * Number(product.unit);
        setProductTaxPrice(taxPrice);
        setCalculatedTotalProductPrice(totalProductPrice);
        
        allProductsCopy[props.indexWhereThisProductIsPlacedInTheArray] = {
            ...product,
            totalPrice: totalProductPrice
        };
        props.setProducts(allProductsCopy);
    }, [product]);
    function saveArticleAndUnit(name: string, value: SelectOption) {
        axiosCaller('GET', `articles/${value?.value}/responsibilities`).then((res) => {
            setSelectedUnitName(res.data?.data?.unit?.name);
            setSelectedUnitId(res.data?.data?.unit?.id);
            setProductCode(res.data?.data?.productCode);
            setArticleId(value?.value)
            setForProduction(res.data?.data?.forProduction)
            handleChange(name, value);
        });
    }
    function saveProduct () {
        axiosCaller('GET', `products/agreements/start-end-date?articleId=${product.designation.value}&unitId=${selectedUnitId}&quantity=${product.unit}&clientId=${props.client?.client?.id}`).then(res => {
            setProduct({
                ...product,
                end: res.data.data?.end,
                start: res.data.data?.start
            });
            let payload = {
                type: productCode,
                designation: product?.designation?.value,
                quantity: product?.unit,
                price: product?.price,
                tax: product?.tax,
                taxPrice: productTaxPrice,
                start: res.data.data?.start,
                end: res.data.data?.end,
                discount: product?.discount,
                clientId: props?.client?.client?.id,
                offerId: null
            }
            if(props.offers?.offerClient?.offerId || props.offers?.offerClient?.offerId !== "undefined"){
                payload.offerId = props.offers?.offerClient?.offerId
            }
            if(product.id){
                axiosCaller('POST', `products${product.id}?_method=PATCH`, payload).then(()=>{
                    toast.success("Produkti u editua me sukses")
                }).catch(()=>{
                    toast.error("Diqka nuk shkoi mire")
                })
            }else{
                axiosCaller('POST', `products`, payload).then((res)=>{
                    if(res?.data?.data){
                        setProduct(res?.data?.data)
                        props.setProducts([
                            ...props.products,
                            res?.data?.data
                        ])
                        toast.success("Produkti u ruajt me sukses")
                    }
                }).catch(()=>{
                    toast.error("Diqka nuk shkoi mire")
                })
            }
        });
    }
    function manuallyUpdateStartAndEndDates () {
        props.setUpdateStartDatePayload(
            {
                startDate: '',
                articleId: product.designation?.value,
                productId: product?.id,
                quantity: product?.unit
            }
        )
    }
    return (
        <div className="product-wrapper">
            <div>
                <div className="d-flex justify-content-between">
                    <p className="list-title">
                        <FormattedMessage id="app.table.nameSurname" defaultMessage="Produkti"/>
                    </p>
                    <div className="x-sign" onClick={() => removeProduct(props.indexWhereThisProductIsPlacedInTheArray)}>
                        <img src={DifferentColoredPlus} alt="close" />
                    </div>
                </div>
                <div className="input-container">
                    <MikaSelect
                        selectWrapperClassName="designation-select max-width-input"
                        value={product.designation}
                        placeholder={props.intl.formatMessage({id: 'client.chooseArticle', defaultMessage: 'Artikujt'})}
                        name="designation"
                        setValueFunction={(name, value) => saveArticleAndUnit(name, value)}
                        options={props.articles}>
                        <FormattedMessage id="table.article" defaultMessage="Artikulli"/>
                    </MikaSelect>
                    <Input
                        name="productCode"
                        label="label"
                        id="productCode"
                        inputWrapperClass="smallerInput  medium"
                        value={productCode || ''}
                        disabled
                        min={0}
                        defaultValue=""
                        type="text"
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="table.nameSurname" defaultMessage="Kodi i produktit"/>
                    </Input>
                    <Input
                        name="productCode"
                        label="label"
                        id="productCode"
                        inputWrapperClass="smallerWidth"
                        value={selectedUnitName || ''}
                        disabled
                        defaultValue=""
                        type="text"
                        min={0}
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="table.nameSurname" defaultMessage="Njesia"/>
                    </Input>
                    <Input
                        name="unit"
                        label="label"
                        id="commentsInput"
                        inputWrapperClass="smallerInput smallerWidth position-relative"
                        value={product.unit || ''}
                        onChange={(name, value) => handleChange(name, value)}
                        defaultValue=""
                        type="number"
                        min={0}
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="table.nameSurname" defaultMessage="Sasia"/>
                        {selectedWarehouseQuantity && <p data-toggle="tooltip" data-placement="left" title="Sasia ne depo:"
                            className={'warehouseQuantity'}>Ne stok: {selectedWarehouseQuantity}</p>}
                    </Input>
                    <Input
                        name="price"
                        label="label"
                        id="commentsInput"
                        inputWrapperClass="smallerInput smallerWidth"
                        value={formatNumberPrice(String(product.price), 2)  || ''}
                        onChange={(name, value) => handleChange(name, value)}
                        defaultValue=""
                        min={0}
                        type="number"
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="table.nameSurname" defaultMessage="Cmimi"/>
                    </Input>
                    <Input
                        name="discount"
                        label="label"
                        id="commentsInput"
                        inputWrapperClass="smallerInput smallerWidth"
                        value={formatNumberPrice(String(product.discount), 2)  || ''}
                        onChange={(name, value) => handleChange(name, value)}
                        defaultValue=""
                        type="number"
                        min={0}
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="app.table.nameSurname" defaultMessage="Zbritje %"/>
                    </Input>
                    <Input
                        name="tax"
                        label="label"
                        id="commentsInput"
                        inputWrapperClass="smallerInput smallerWidth"
                        value={formatNumberPrice(String(product.tax), 2) || ''}
                        onChange={(name, value) => handleChange(name, value)}
                        defaultValue=""
                        type="number"
                        min={0}
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="table.nameSurname" defaultMessage="TVSH %"/>
                    </Input>
                    <Input
                        name="totalPrice"
                        label="label"
                        id="commentsInput"
                        inputWrapperClass="smallerInput taxPrice medium"
                        value={toFixedNumber(calculatedTotalProductPrice, 2) || ''}
                        defaultValue=""
                        type="number"
                        disabled
                        min={0}
                        inputTextType={EInputTextType.SimpleInput}>
                        <FormattedMessage id="table.nameSurname" defaultMessage="Totali"/>
                    </Input>
                    <Input
                        name="start"
                        label="label"
                        id="start"
                        inputWrapperClass="smallerInput startDate"
                        value={(product?.start && formatDate(product?.start)) || ''}
                        defaultValue=""
                        // type="date"
                        disabled
                        inputTextType={EInputTextType.SimpleInput}>
                        {forProduction ?
                            <FormattedMessage id="client.scanDocument" defaultMessage="Data e fillimit te prodhimit"/>
                            :
                            <FormattedMessage id="client.scanDocument" defaultMessage="Data e porosise"/>
                        }
                    </Input>
                    <Input
                        name="end"
                        label="label"
                        id="end"
                        inputWrapperClass="smallerInput endDate"
                        value={(product?.end && formatDate(product?.end)) || ''}
                        defaultValue=""
                        // type="text"
                        disabled
                        inputTextType={EInputTextType.SimpleInput}>
                        {forProduction ?
                            <FormattedMessage id="client.scanDocument" defaultMessage="Data e mbarimit te prodhimit"/>
                            :
                            <FormattedMessage id="client.scanDocument" defaultMessage="Data e liferimit"/>
                        }
                    </Input>
                </div>
                {!(product.id) ?
                    <Button
                        onClick={saveProduct}
                        className="button-save-offer w-10  align-items-center calculateOfferButton py-2 text-center border-0">
                        <FormattedMessage id="offer.saveOffer" defaultMessage="Ruaj Produktin"/>
                    </Button>
                    :
                    <Button
                        onClick={manuallyUpdateStartAndEndDates}
                        className="button-save-offer w-10  align-items-center calculateOfferButton py-2 text-center border-0">
                        <FormattedMessage id="offer.saveOffer" defaultMessage="Ndysho daten e fillimit"/>
                    </Button>
                }
                <hr className="mx-auto product-seperation-line"/>
            </div>
        </div>
    );
};
function mapGlobalStateToProps(state: RootState, ownProps: any) {
    return {
        ...ownProps,
        ...state.app,
        offers: state.offers,
        admin: state.admin,
        client: state.client
    };
}
function mapDispatchToProps(dispatch: Dispatch<actions.ACTION>) {
    return {
        offerActions: bindActionCreators(offerActions as any, dispatch),
        adminActions: bindActionCreators(adminActions as any, dispatch),
    };
}
export default withRouter(connect(mapGlobalStateToProps, mapDispatchToProps)(injectIntl(Product as any)));