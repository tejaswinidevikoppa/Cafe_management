import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogClose, MatDialogConfig } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { BillService } from 'src/app/services/bill.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { GlobalConstants } from 'src/app/shared/global-constants';
import { ConfirmationComponent } from '../dialog/confirmation/confirmation.component';
import { ViewBillProductsComponent } from '../dialog/view-bill-products/view-bill-products.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-view-bill',
  templateUrl: './view-bill.component.html',
  styleUrls: ['./view-bill.component.scss']
})
export class ViewBillComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'contactNumber', 'paymentMethod', 'total', 'view'];
  dataSource:any;
  responseMessage: any;
  constructor(private router:Router, 
    private dialog:MatDialog,
    private ngxService:NgxUiLoaderService,
     private snackbar: SnackbarService, 
     private billService: BillService) { }

  ngOnInit(): void {
    this.ngxService.start();
    this.tableData();
  }

  tableData(){
    this.billService.getBills().subscribe((res:any)=>{
      this.ngxService.stop();
      this.dataSource = new MatTableDataSource(res);
    },(err:any)=>{
      this.ngxService.stop();
      if(err.error?.message){
        this.responseMessage = err.error?.message;
      }
      else{
        this.responseMessage = GlobalConstants.genericError;
      }
      this.snackbar.openSnackBar(this.responseMessage,GlobalConstants.error);
    })
  }

  applyFilter(event:Event){
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  handleViewAction(value:any){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      data:value
    };

    dialogConfig.width = "100%";
    const dialogRef = this.dialog.open(ViewBillProductsComponent,dialogConfig); //dependent
    this.router.events.subscribe(()=>{
      dialogRef.close();
    })
  }

  handleDeleteAction(value:any){
      const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {
          message:'delete ' + value.name + ' bill '
        }
        dialogConfig.width="500px";
        const dialogRef = this.dialog.open(ConfirmationComponent,dialogConfig);
        const sub = dialogRef.componentInstance.onEmitStatusChange.subscribe((res)=>{
          this.ngxService.start();
          this.deletebill(value.id);
          dialogRef.close();
        })
      }

    
    deletebill(id:any){
      this.billService.delete(id).subscribe((res:any)=>{
        this.ngxService.stop();
        this.tableData();
        this.responseMessage = res.message;
        this.snackbar.openSnackBar(this.responseMessage,"success");
      },(err:any)=>{
        this.ngxService.stop();
        if(err.error?.message){
          this.responseMessage = err.error?.message;
        }
        else{
          this.responseMessage = GlobalConstants.genericError;
        }
        this.snackbar.openSnackBar(this.responseMessage,GlobalConstants.error);
      })
    }
    


  downloadReport(value:any){
    this.ngxService.start();
    var data = {
      name:value.name,
      email:value.email,
      uuid:value.uuid,
      contactNumber:value.contactNumber,
      paymentMethod:value.paymentMethod,
      totalAmount : value.total,
      productDetails: value.productDetails
    }
    this.billService.getPdf(data).subscribe(
      (res)=>{
        saveAs(res,value.uuid+'.pdf');
        this.ngxService.stop();
      }
    )
  }
}
