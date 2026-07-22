import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class InfrastructureComplaintManagement extends LightningElement {

    handleSuccess() {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Complaint Registered Successfully',
                variant: 'success'
            })
        );
    }

    handleReset() {

        const fields =
            this.template.querySelectorAll(
                'lightning-input-field'
            );

        if(fields){

            fields.forEach(field=>{
                field.reset();
            });

        }

    }

}