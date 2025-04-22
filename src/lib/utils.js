import { env } from '$env/dynamic/public';
import { ethers } from 'ethers';
import CBDC_ABI from '$lib/ABIs/CBDC';
import ESCROW_ABI from '$lib/ABIs/EscrowService';

export async function autoRetry (functionToTry, amountOfRetry = 5) {
    while (amountOfRetry > 0) {
        try {
            const result = await functionToTry();
            return result;
        } catch (e) {
            amountOfRetry--;
            if (amountOfRetry === 0) {
                console.log('Auto retry has failed with the reason: ', e);
            }
        }
    }
}


export function currencyFormat(num, decimalPlaces = 2){
    return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces});
}

export function handleException(e){
    console.error(e);
    let error1 = 'Error Message:';
    let error2 = e;

    let regexResult = e.toString().match(/reason="([^"]+)/);
    if(regexResult && regexResult.length >= 2){
        error2 = regexResult[1];
    }
    if(e.data){
        error1 = `ERROR ${e.code}: ${e.message}`;
        error2 =  e.data.message;
    }
    UIkit.modal.alert(`
        <div class="uk-alert uk-alert-danger uk-text-center">
            Failed. There was a problem with your transaction, please try again.
        </div>

        <div class="round-card">
            ${error1}
            <br />
            <br />
            <div class="round-card l2">${error2}</div>
        </div>
    `);
}

export function getProvider(){
    return new ethers.providers.JsonRpcProvider(env.PUBLIC_RPC);
}

export async function getBalance(address){
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return +ethers.utils.formatEther(balance);
}

export function getSigner_Admin(){
    return new ethers.Wallet(env.PUBLIC_ADMIN_KEY, getProvider());
}

export function getSigner_Buyer(){
    return new ethers.Wallet(env.PUBLIC_BUYER_KEY, getProvider());
}

export function getSigner_Seller(){
    return new ethers.Wallet(env.PUBLIC_SELLER_KEY, getProvider());
}

export function getContract_CBDC(provider){
    provider = provider || getProvider();
    return new ethers.Contract(env.PUBLIC_CBDC_ADDR, CBDC_ABI, provider);
}

export function getContract_EscrowService(provider){
    provider = provider || getProvider();
    return new ethers.Contract(env.PUBLIC_ESCROW_ADDR, ESCROW_ABI, provider);
}

export async function getOrders(){
    const Escrow = getContract_EscrowService();
    const counter = await Escrow.transactionCounter();
    let orders = [];
    for(let i = 0; i < counter; i++){
        let order = await Escrow.getTransaction(i);
        orders.push({
            order: order,
            transactionId: i,
            seller: order.seller,
            amount: ethers.utils.formatUnits(order.amount),
            description: order.description,
            trackingNumber: order.trackingNumber,
            isPaid: order.isPaid,
            isDelivered: order.isDelivered,
            isCompleted: order.isCompleted
        });
    }
    return orders;
}


export default {};